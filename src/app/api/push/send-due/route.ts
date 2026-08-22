import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database, PreferenciasNotificacao } from '@/lib/supabase/types';
import { estaNaJanelaDeEnvio, diaDaSemanaNoFuso, dataLocalISO } from '@/lib/push/timeWindow';
import { proximoHorarioPermitido } from '@/lib/push/quietHours';
import { avaliarLimiteDeEnvio } from '@/lib/push/antiSpam';
import { gerarCandidatosParaUsuaria } from '@/lib/push/candidatos';
import { escolherMensagem } from '@/lib/push/mensagens';
import { enviarParaSubscricoes, garantirVapidConfigurado } from '@/lib/push/enviar';
import { deepLinkSeguro } from '@/lib/push/deepLink';

// Cron protegido por CRON_SECRET (rodando a cada 15-30min, ver vercel.json) —
// faz três coisas em cada execução:
//   1. lembrete diário de check-in (fluxo legado, agora idempotente via
//      push_envios em vez de depender só da granularidade do cron);
//   2. GERA candidatos novos de sessão abandonada/disponível/pendente/
//      inatividade/continuidade em push_notificacoes, respeitando
//      preferências e horário silencioso;
//   3. ENVIA (ou cancela, se a pendência já se resolveu, ou adia, se
//      estourou o limite de frequência) as notificações vencidas.
//
// Idempotência/concorrência: o passo 3 reivindica linhas com um UPDATE
// condicional (status='pendente' -> 'processando'); sob o isolamento padrão
// do Postgres (read committed), duas execuções concorrentes nunca
// reivindicam a mesma linha — a segunda simplesmente não a encontra mais
// como 'pendente' depois que a primeira commitou.
const TENTATIVAS_MAXIMAS = 3;
const REAGENDAR_APOS_LIMITE_HORAS = 1;

// Comparação em tempo constante: `!==` em string vaza, por timing, quantos
// caracteres do início batem, o que em teoria ajuda um atacante a adivinhar
// o CRON_SECRET byte a byte. timingSafeEqual exige buffers do mesmo
// tamanho — por isso o `length` check antes, que não vaza informação útil
// (o comprimento de um secret gerado aleatoriamente não é sensível).
function segredoDoCronValido(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  const esperado = Buffer.from(`Bearer ${secret}`);
  const recebido = Buffer.from(authHeader);
  if (esperado.length !== recebido.length) return false;
  return timingSafeEqual(esperado, recebido);
}

export async function GET(request: NextRequest) {
  if (!segredoDoCronValido(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  garantirVapidConfigurado();

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const agora = new Date();
  const resultado = {
    checkinEnviados: 0,
    candidatosGerados: 0,
    enviadas: 0,
    canceladas: 0,
    adiadas: 0,
    falhas: 0,
  };

  resultado.checkinEnviados = await processarLembreteCheckin(supabaseAdmin, agora);

  // --- dados compartilhados entre a geração (passo 2) e o envio (passo 3) ---
  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('usuaria_id');
  const usuariaIds = [...new Set((subs ?? []).map((s) => s.usuaria_id))];

  if (usuariaIds.length > 0) {
    const [{ data: perfis }, { data: preferencias }] = await Promise.all([
      supabaseAdmin.from('perfis').select('id, fuso_horario').in('id', usuariaIds),
      supabaseAdmin.from('preferencias_notificacoes').select('*').in('usuaria_id', usuariaIds),
    ]);

    const fusoPorUsuaria = new Map((perfis ?? []).map((p) => [p.id, p.fuso_horario]));
    const prefPorUsuaria = new Map((preferencias ?? []).map((p) => [p.usuaria_id, p]));

    resultado.candidatosGerados = await gerarEEnfileirar(supabaseAdmin, usuariaIds, fusoPorUsuaria, prefPorUsuaria, agora);

    const contadoresEnvio = await processarVencidas(supabaseAdmin, fusoPorUsuaria, prefPorUsuaria, agora);
    Object.assign(resultado, {
      enviadas: contadoresEnvio.enviadas,
      canceladas: contadoresEnvio.canceladas,
      adiadas: contadoresEnvio.adiadas,
      falhas: contadoresEnvio.falhas,
    });
  }

  return NextResponse.json(resultado);
}

// ---------------------------------------------------------------------------
// 1. Lembrete diário de check-in (fluxo legado)
// ---------------------------------------------------------------------------
async function processarLembreteCheckin(supabaseAdmin: ReturnType<typeof createClient<Database>>, agora: Date): Promise<number> {
  const { data: perfis } = await supabaseAdmin
    .from('perfis')
    .select('id, horario_preferido_notificacao, fuso_horario')
    .not('horario_preferido_notificacao', 'is', null);

  const candidatos = (perfis ?? []).filter((p) =>
    estaNaJanelaDeEnvio(p.horario_preferido_notificacao, agora, p.fuso_horario)
  );
  if (candidatos.length === 0) return 0;

  const { data: preferencias } = await supabaseAdmin
    .from('preferencias_notificacoes')
    .select('usuaria_id, lembrete_checkin, dias_semana, pausada_ate')
    .in('usuaria_id', candidatos.map((c) => c.id));

  const preferenciaPorUsuaria = new Map((preferencias ?? []).map((p) => [p.usuaria_id, p]));

  let enviados = 0;
  for (const perfil of candidatos) {
    const preferencia = preferenciaPorUsuaria.get(perfil.id);
    const hojeLocal = dataLocalISO(agora, perfil.fuso_horario);

    if (preferencia && !preferencia.lembrete_checkin) continue;
    if (preferencia && preferencia.dias_semana && !preferencia.dias_semana.includes(diaDaSemanaNoFuso(agora, perfil.fuso_horario))) continue;
    if (preferencia?.pausada_ate && preferencia.pausada_ate >= hojeLocal) continue;

    // Idempotência real (constraint unique em push_envios): se já registramos
    // o envio de hoje para esta usuária, o insert falha e pulamos — sem isso,
    // rodar o cron mais de uma vez por dia (ou aumentar a frequência dele)
    // duplicaria o lembrete.
    const { error: erroIdempotencia } = await supabaseAdmin
      .from('push_envios')
      .insert({ usuaria_id: perfil.id, tipo: 'checkin', data_local: hojeLocal });
    if (erroIdempotencia) continue;

    const { data: subsUsuaria } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('usuaria_id', perfil.id);
    if (!subsUsuaria || subsUsuaria.length === 0) continue;

    const { enviados: enviadosUsuaria } = await enviarParaSubscricoes(supabaseAdmin, subsUsuaria, {
      title: 'Rose',
      body: 'Seu momento de cuidado de hoje está te esperando.',
      url: '/checkin',
      tag: 'checkin-diario',
    });
    if (enviadosUsuaria > 0) enviados++;
  }

  return enviados;
}

// ---------------------------------------------------------------------------
// 2. Geração de candidatos (sessão abandonada/disponível/pendente/
//    inatividade/continuidade)
// ---------------------------------------------------------------------------
async function gerarEEnfileirar(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  usuariaIds: string[],
  fusoPorUsuaria: Map<string, string>,
  prefPorUsuaria: Map<string, PreferenciasNotificacao>,
  agora: Date
): Promise<number> {
  let geradas = 0;

  for (const usuariaId of usuariaIds) {
    const fuso = fusoPorUsuaria.get(usuariaId) ?? 'UTC';
    const pref = prefPorUsuaria.get(usuariaId);
    const hojeLocal = dataLocalISO(agora, fuso);

    if (pref?.pausada_ate && pref.pausada_ate >= hojeLocal) continue;

    const candidatos = await gerarCandidatosParaUsuaria(supabaseAdmin, usuariaId, agora, hojeLocal, {
      lembreteJornada: pref?.lembrete_jornada ?? true,
      lembretePraticas: pref?.lembrete_praticas ?? true,
      lembreteInatividade: pref?.lembrete_inatividade ?? true,
    });

    for (const candidato of candidatos) {
      const mensagem = escolherMensagem(candidato.categoria, candidato.dedupKey);
      const inicioSilencio = (pref?.horario_silencio_inicio ?? '21:30:00').slice(0, 5);
      const fimSilencio = (pref?.horario_silencio_fim ?? '09:00:00').slice(0, 5);
      const agendadoPara = proximoHorarioPermitido(agora, fuso, inicioSilencio, fimSilencio);

      const { data: inserida } = await supabaseAdmin
        .from('push_notificacoes')
        .upsert(
          {
            usuaria_id: usuariaId,
            categoria: candidato.categoria,
            dedup_key: candidato.dedupKey,
            titulo: mensagem.titulo,
            corpo: mensagem.corpo,
            url: deepLinkSeguro(candidato.url),
            tag: candidato.dedupKey,
            agendado_para: agendadoPara.toISOString(),
          },
          { onConflict: 'usuaria_id,dedup_key', ignoreDuplicates: true }
        )
        .select('id');
      geradas += inserida?.length ?? 0;
    }
  }

  return geradas;
}

// ---------------------------------------------------------------------------
// 3. Envio das notificações vencidas
// ---------------------------------------------------------------------------
async function processarVencidas(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  fusoPorUsuaria: Map<string, string>,
  prefPorUsuaria: Map<string, PreferenciasNotificacao>,
  agora: Date
) {
  const contadores = { enviadas: 0, canceladas: 0, adiadas: 0, falhas: 0 };

  // Reivindica atomicamente todas as linhas vencidas (ver comentário de
  // concorrência no topo do arquivo).
  const { data: devidas } = await supabaseAdmin
    .from('push_notificacoes')
    .update({ status: 'processando' })
    .eq('status', 'pendente')
    .lte('agendado_para', agora.toISOString())
    .select('*');

  for (const linha of devidas ?? []) {
    const fuso = fusoPorUsuaria.get(linha.usuaria_id) ?? 'UTC';
    const pref = prefPorUsuaria.get(linha.usuaria_id);
    const hojeLocal = dataLocalISO(agora, fuso);

    // A pendência ainda existe? Reexecuta a mesma geração de candidatos: se a
    // dedup_key não aparece mais (sessão concluída, jornada travada de novo
    // etc.), a pendência se resolveu sozinha — cancela sem enviar.
    const candidatosAtuais = await gerarCandidatosParaUsuaria(supabaseAdmin, linha.usuaria_id, agora, hojeLocal, {
      lembreteJornada: pref?.lembrete_jornada ?? true,
      lembretePraticas: pref?.lembrete_praticas ?? true,
      lembreteInatividade: pref?.lembrete_inatividade ?? true,
    });
    const aindaPendente = candidatosAtuais.some((c) => c.dedupKey === linha.dedup_key);

    if (!aindaPendente || (pref?.pausada_ate && pref.pausada_ate >= hojeLocal)) {
      await supabaseAdmin
        .from('push_notificacoes')
        .update({ status: 'cancelada', titulo: null, corpo: null, url: null, tag: null })
        .eq('id', linha.id);
      contadores.canceladas++;
      continue;
    }

    // Limite de frequência global (todas as categorias + check-in juntos).
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: enviosNovos }, { data: enviosCheckin }] = await Promise.all([
      supabaseAdmin
        .from('push_notificacoes')
        .select('enviado_em')
        .eq('usuaria_id', linha.usuaria_id)
        .eq('status', 'enviada')
        .gte('enviado_em', seteDiasAtras),
      supabaseAdmin
        .from('push_envios')
        .select('criado_em')
        .eq('usuaria_id', linha.usuaria_id)
        .gte('criado_em', seteDiasAtras),
    ]);
    const historico = [
      ...(enviosNovos ?? []).map((e) => new Date(e.enviado_em!)),
      ...(enviosCheckin ?? []).map((e) => new Date(e.criado_em)),
    ];

    const avaliacao = avaliarLimiteDeEnvio(agora, historico);
    if (!avaliacao.podeEnviar) {
      await supabaseAdmin
        .from('push_notificacoes')
        .update({
          status: 'pendente',
          agendado_para: new Date(agora.getTime() + REAGENDAR_APOS_LIMITE_HORAS * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', linha.id);
      contadores.adiadas++;
      continue;
    }

    const { data: subsUsuaria } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('usuaria_id', linha.usuaria_id);

    const { enviados } = await enviarParaSubscricoes(supabaseAdmin, subsUsuaria ?? [], {
      title: linha.titulo ?? 'Rose',
      body: linha.corpo ?? 'Você tem uma novidade te esperando.',
      url: linha.url ?? '/inicio',
      tag: linha.tag ?? linha.dedup_key,
    });

    if (enviados > 0) {
      await supabaseAdmin
        .from('push_notificacoes')
        .update({ status: 'enviada', enviado_em: agora.toISOString(), titulo: null, corpo: null, url: null, tag: null })
        .eq('id', linha.id);
      contadores.enviadas++;
    } else {
      const tentativas = linha.tentativas + 1;
      if (tentativas >= TENTATIVAS_MAXIMAS) {
        await supabaseAdmin
          .from('push_notificacoes')
          .update({ status: 'falha', tentativas, titulo: null, corpo: null, url: null, tag: null })
          .eq('id', linha.id);
        contadores.falhas++;
      } else {
        await supabaseAdmin
          .from('push_notificacoes')
          .update({
            status: 'pendente',
            tentativas,
            agendado_para: new Date(agora.getTime() + REAGENDAR_APOS_LIMITE_HORAS * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', linha.id);
        contadores.adiadas++;
      }
    }
  }

  return contadores;
}

