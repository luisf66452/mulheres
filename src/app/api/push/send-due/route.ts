import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { estaNaJanelaDeEnvio, diaDaSemanaNoFuso, dataLocalISONoFuso } from '@/lib/push/timeWindow';
import { decidirTipoNotificacao, MENSAGENS_POR_TIPO } from '@/lib/push/prioridade';
import { SUPPORT_EMAIL } from '@/lib/config/contato';

// Roda duas vezes ao dia (ver vercel.json) — não a cada minuto. Cada
// execução varre todas as usuárias com horário preferido definido e, para
// cada uma cujo horário local caia dentro da janela de tolerância desta
// execução (estaNaJanelaDeEnvio), decide no máximo UM tipo de notificação
// (decidirTipoNotificacao) e usa push_envios (constraint unique por
// usuária+tipo+dia local) como trava de idempotência real — mesmo que o cron
// rode de novo, ou as duas execuções do dia caiam na janela da mesma
// usuária, ela nunca recebe duas notificações do mesmo tipo no mesmo dia.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'push not configured' }, { status: 503 });
  }

  webpush.setVapidDetails(
    `mailto:${SUPPORT_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const agora = new Date();

  const { data: perfis, error: erroPerfis } = await supabaseAdmin
    .from('perfis')
    .select('id, horario_preferido_notificacao, fuso_horario')
    .not('horario_preferido_notificacao', 'is', null);

  if (erroPerfis) {
    console.error('[push/send-due] falha ao buscar perfis', { message: erroPerfis.message });
    return NextResponse.json({ error: 'failed to load perfis' }, { status: 500 });
  }

  // Janela e dia da semana calculados no fuso de CADA usuária (não um único
  // horário/dia global do servidor) — essenciais pra respeitar o horário que
  // ela escolheu de verdade, e pra "dias da semana" bater com o calendário
  // dela perto da virada da meia-noite local.
  const candidatos = (perfis ?? []).filter((p) =>
    estaNaJanelaDeEnvio(p.horario_preferido_notificacao, agora, p.fuso_horario)
  );

  if (candidatos.length === 0) {
    return NextResponse.json({ enviados: 0, avaliados: 0 });
  }

  const idsCandidatos = candidatos.map((c) => c.id);

  const [{ data: preferencias }, { data: jornadasAtivas }, { data: checkinsRecentes }] = await Promise.all([
    supabaseAdmin
      .from('preferencias_notificacoes')
      .select('usuaria_id, lembrete_checkin, lembrete_jornada, lembrete_praticas, resumo_semanal, dias_semana')
      .in('usuaria_id', idsCandidatos),
    supabaseAdmin
      .from('jornadas_usuarias')
      .select('usuaria_id, jornada_id, jornadas(titulo)')
      .in('usuaria_id', idsCandidatos)
      .eq('status', 'em_andamento'),
    // Janela ampla (3 dias) para cobrir qualquer fuso horário possível sem
    // depender de "hoje" em UTC — o filtro por dia local exato acontece
    // abaixo, em JS, usando o fuso de cada usuária.
    supabaseAdmin
      .from('checkins')
      .select('usuaria_id, data')
      .in('usuaria_id', idsCandidatos)
      .gte('data', new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
  ]);

  const preferenciaPorUsuaria = new Map((preferencias ?? []).map((p) => [p.usuaria_id, p]));
  const jornadaAtivaPorUsuaria = new Map(
    (jornadasAtivas ?? []).map((j) => [
      j.usuaria_id,
      (j.jornadas as unknown as { titulo: string } | null)?.titulo ?? null,
    ])
  );
  const datasCheckinPorUsuaria = new Map<string, Set<string>>();
  for (const checkin of checkinsRecentes ?? []) {
    const atual = datasCheckinPorUsuaria.get(checkin.usuaria_id) ?? new Set<string>();
    atual.add(checkin.data);
    datasCheckinPorUsuaria.set(checkin.usuaria_id, atual);
  }

  let enviados = 0;

  for (const perfil of candidatos) {
    const dataLocal = dataLocalISONoFuso(agora, perfil.fuso_horario);
    const diaSemanaLocal = diaDaSemanaNoFuso(agora, perfil.fuso_horario);
    const checkinFeitoHoje = datasCheckinPorUsuaria.get(perfil.id)?.has(dataLocal) ?? false;

    const tipo = decidirTipoNotificacao({
      checkinFeitoHoje,
      jornadaAtivaTitulo: jornadaAtivaPorUsuaria.get(perfil.id) ?? null,
      preferencias: preferenciaPorUsuaria.get(perfil.id) ?? null,
      diaDaSemana: diaSemanaLocal,
    });

    if (!tipo) continue;

    // Trava de idempotência real: a constraint unique(usuaria_id, tipo,
    // data_local) faz a segunda tentativa (reexecução do cron, ou as duas
    // janelas do dia caindo ambas dentro da tolerância) falhar de forma
    // atômica no banco, não só por lógica de aplicação.
    const { error: erroIdempotencia } = await supabaseAdmin
      .from('push_envios')
      .insert({ usuaria_id: perfil.id, tipo, data_local: dataLocal });

    if (erroIdempotencia) {
      if (erroIdempotencia.code === '23505') continue; // já enviado hoje
      console.error('[push/send-due] falha ao registrar idempotência', {
        message: erroIdempotencia.message,
      });
      continue;
    }

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('usuaria_id', perfil.id);

    const mensagem = MENSAGENS_POR_TIPO[tipo];

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: mensagem.titulo, body: mensagem.corpo, url: mensagem.url })
        );
        enviados++;
      } catch (erroEnvio) {
        const statusCode = (erroEnvio as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Inscrição expirada/revogada no navegador — o provedor confirma
          // que nunca mais vai entregar nada nesse endpoint. Remove para não
          // tentar de novo indefinidamente.
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  }

  return NextResponse.json({ enviados, avaliados: candidatos.length });
}
