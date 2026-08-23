// Ponte entre o banco (Supabase) e as regras puras de regras.ts. Isolado num
// arquivo próprio (em vez de dentro da rota) para poder ser chamado duas
// vezes pelo cron com o mesmo resultado: uma vez para GERAR candidatos, outra
// para VERIFICAR se uma pendência já enfileirada ainda existe de fato antes
// de enviar (ex.: a usuária concluiu a sessão entre a geração e o envio).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { buscarJornadaPorSlug, listarSessoesEmOrdem } from '@/lib/jornadas-conteudo/dados';
import {
  avaliarSessaoAbandonada,
  avaliarPraticaPendente,
  avaliarSessaoDisponivel,
  avaliarContinuidade,
  avaliarInatividade,
  type CandidatoNotificacao,
  type SessaoContexto,
} from './regras';

/**
 * Monta o contexto de sessões (estado calculado, não bruto) de todas as
 * jornadas que a usuária JÁ tocou pelo menos uma vez — de propósito não
 * inclui jornadas nunca abertas, para não notificar sobre conteúdo que ela
 * nunca demonstrou interesse (isso seria propaganda, não lembrete).
 */
async function montarContextoSessoes(
  supabaseAdmin: SupabaseClient<Database>,
  usuariaId: string
): Promise<SessaoContexto[]> {
  const { data: linhas } = await supabaseAdmin
    .from('sessoes_jornadas_conteudo_progresso')
    .select('jornada_slug, sessao_id, iniciada_em, concluida_em')
    .eq('usuaria_id', usuariaId);

  if (!linhas || linhas.length === 0) return [];

  const slugs = [...new Set(linhas.map((l) => l.jornada_slug))];
  const contexto: SessaoContexto[] = [];

  for (const slug of slugs) {
    const jornada = buscarJornadaPorSlug(slug);
    if (!jornada) continue; // conteúdo removido/renomeado desde que a usuária começou — ignora com segurança.

    const progressoPorSessao = new Map(linhas.filter((l) => l.jornada_slug === slug).map((l) => [l.sessao_id, l]));

    const sessoesOrdenadas = listarSessoesEmOrdem(jornada);
    let todasAnterioresConcluidas = true;
    let indiceUltimaConcluida = -1;

    sessoesOrdenadas.forEach((sessao, indice) => {
      const linha = progressoPorSessao.get(sessao.id);
      let estado: SessaoContexto['estado'];

      if (linha?.concluida_em) {
        estado = 'concluida';
        indiceUltimaConcluida = indice;
      } else if (!todasAnterioresConcluidas) {
        estado = 'bloqueada';
      } else {
        estado = linha ? 'em_andamento' : 'disponivel';
        todasAnterioresConcluidas = false;
      }

      contexto.push({
        sessaoId: sessao.id,
        jornadaSlug: slug,
        tipo: sessao.tipo,
        estado,
        iniciadaEm: linha?.iniciada_em ?? null,
        concluidaEm: linha?.concluida_em ?? null,
        proximaDeUmaConclusao: indice === indiceUltimaConcluida + 1 && indiceUltimaConcluida !== -1,
      });
    });
  }

  return contexto;
}

async function buscarUltimaAtividade(supabaseAdmin: SupabaseClient<Database>, usuariaId: string): Promise<Date | null> {
  const [{ data: checkin }, { data: sessaoProgresso }, { data: praticaConteudo }] = await Promise.all([
    supabaseAdmin
      .from('checkins')
      .select('criado_em')
      .eq('usuaria_id', usuariaId)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('sessoes_jornadas_conteudo_progresso')
      .select('iniciada_em, concluida_em')
      .eq('usuaria_id', usuariaId)
      .order('iniciada_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('conclusoes_praticas_conteudo')
      .select('concluida_em')
      .eq('usuaria_id', usuariaId)
      .order('concluida_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const candidatos = [
    checkin?.criado_em,
    sessaoProgresso?.concluida_em,
    sessaoProgresso?.iniciada_em,
    praticaConteudo?.concluida_em,
  ].filter((v): v is string => Boolean(v));

  if (candidatos.length === 0) return null;
  return new Date(Math.max(...candidatos.map((v) => new Date(v).getTime())));
}

export interface PreferenciasEfetivas {
  lembreteJornada: boolean;
  lembretePraticas: boolean;
  lembreteInatividade: boolean;
}

/**
 * Todos os candidatos elegíveis de uma usuária neste instante, já filtrados
 * pelas preferências por categoria dela (nada de sessão bloqueada/concluída/
 * paga entra aqui — isso já é garantido por `montarContextoSessoes` e pelas
 * regras puras).
 */
export async function gerarCandidatosParaUsuaria(
  supabaseAdmin: SupabaseClient<Database>,
  usuariaId: string,
  agora: Date,
  dataLocalHoje: string,
  preferencias: PreferenciasEfetivas
): Promise<CandidatoNotificacao[]> {
  const contexto = await montarContextoSessoes(supabaseAdmin, usuariaId);
  const candidatos: CandidatoNotificacao[] = [];

  if (preferencias.lembreteJornada) {
    // 24h sem progresso (não "algumas horas") — pedido explícito para não
    // insistir cedo demais numa sessão que a usuária só começou a explorar.
    candidatos.push(...avaliarSessaoAbandonada(contexto, agora, 24));
    candidatos.push(...avaliarSessaoDisponivel(contexto, dataLocalHoje));
    candidatos.push(...avaliarContinuidade(contexto, agora));
  }

  if (preferencias.lembretePraticas) {
    candidatos.push(...avaliarPraticaPendente(contexto, agora));
  }

  if (preferencias.lembreteInatividade) {
    const ultimaAtividade = await buscarUltimaAtividade(supabaseAdmin, usuariaId);
    candidatos.push(...avaliarInatividade(ultimaAtividade, agora));
  }

  return candidatos;
}
