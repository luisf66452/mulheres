// Resolve a Prioridade 1 (retomar sessão em andamento) e a Prioridade 2
// (próxima sessão desbloqueada) do card "Continuar de onde parei" da Home
// (Seção 5 do design). A Prioridade 3 (rascunho local de prática rápida)
// não entra aqui: depende de localStorage, então é resolvida inteiramente
// no client component ContinuarPraticaLocalClient — este módulo cobre só o
// que é decidível a partir de sessoes_jornadas_conteudo_progresso.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { Jornada } from './tipos';
import { listarSessoesEmOrdem } from './dados';
import { calcularEstadosSessoes } from './progresso';

export interface LinhaProgressoSessao {
  jornadaSlug: string;
  sessaoId: string;
  iniciadaEm: string;
  concluidaEm: string | null;
}

export interface ProximaAcaoJornada {
  jornadaSlug: string;
  sessaoId: string;
  modo: 'retomar' | 'proxima';
}

/**
 * Prioridade 1: sessão com iniciada_em preenchido e concluida_em nulo.
 * Como o único índice único de sessoes_jornadas_conteudo_progresso é
 * (usuaria_id, sessao_id) — não por jornada — a usuária pode, em teoria,
 * ter sessões em andamento em mais de uma jornada ao mesmo tempo; desempata
 * pela mais recentemente iniciada.
 */
export function escolherSessaoEmAndamento(
  linhas: LinhaProgressoSessao[]
): LinhaProgressoSessao | null {
  const emAndamento = linhas.filter((linha) => linha.concluidaEm === null);
  if (emAndamento.length === 0) return null;
  return [...emAndamento].sort(
    (a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime()
  )[0];
}

/**
 * Prioridade 2: só chamada quando escolherSessaoEmAndamento já retornou
 * null. Considera só jornadas com pelo menos uma linha de progresso (uma
 * jornada nunca tocada não "continua" coisa nenhuma) e usa
 * calcularEstadosSessoes (já usado por /jornadas/[slug]) para nunca
 * expor uma sessão bloqueada nem uma jornada já 100% concluída. Entre
 * jornadas com progresso, prioriza a tocada mais recentemente.
 */
export function escolherProximaSessaoDesbloqueada(
  jornadas: Jornada[],
  linhas: LinhaProgressoSessao[]
): { jornadaSlug: string; sessaoId: string } | null {
  const linhasPorJornada = new Map<string, LinhaProgressoSessao[]>();
  for (const linha of linhas) {
    const lista = linhasPorJornada.get(linha.jornadaSlug) ?? [];
    lista.push(linha);
    linhasPorJornada.set(linha.jornadaSlug, lista);
  }

  const slugsPorRecencia = [...linhasPorJornada.entries()]
    .map(([slug, linhasDaJornada]) => ({
      slug,
      maisRecente: Math.max(...linhasDaJornada.map((l) => new Date(l.iniciadaEm).getTime())),
    }))
    .sort((a, b) => b.maisRecente - a.maisRecente)
    .map((entrada) => entrada.slug);

  for (const slug of slugsPorRecencia) {
    const jornada = jornadas.find((j) => j.slug === slug);
    if (!jornada) continue;

    const progresso: Record<string, { concluidaEm: string | null }> = {};
    for (const linha of linhasPorJornada.get(slug) ?? []) {
      progresso[linha.sessaoId] = { concluidaEm: linha.concluidaEm };
    }

    const estados = calcularEstadosSessoes(jornada, progresso);
    const proxima = listarSessoesEmOrdem(jornada).find((sessao) => estados[sessao.id] === 'disponivel');
    if (proxima) {
      return { jornadaSlug: slug, sessaoId: proxima.id };
    }
  }

  return null;
}

/** Composição das duas prioridades — ponto único usado pelo componente da Home. */
export function resolverProximaAcaoJornada(
  jornadas: Jornada[],
  linhas: LinhaProgressoSessao[]
): ProximaAcaoJornada | null {
  const emAndamento = escolherSessaoEmAndamento(linhas);
  if (emAndamento) {
    return { jornadaSlug: emAndamento.jornadaSlug, sessaoId: emAndamento.sessaoId, modo: 'retomar' };
  }

  const proxima = escolherProximaSessaoDesbloqueada(jornadas, linhas);
  if (proxima) {
    return { ...proxima, modo: 'proxima' };
  }

  return null;
}

/**
 * Lê, de uma vez, o progresso da usuária em TODAS as jornadas (não filtra
 * por jornada_slug, ao contrário de carregarProgressoJornada) — necessário
 * porque a Prioridade 1 precisa enxergar uma sessão em andamento em
 * qualquer jornada, e a Prioridade 2 precisa comparar recência entre
 * jornadas diferentes.
 */
export async function buscarLinhasProgressoTodasJornadas(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<LinhaProgressoSessao[]> {
  const { data, error } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .select('jornada_slug, sessao_id, iniciada_em, concluida_em')
    .eq('usuaria_id', usuariaId);

  if (error) {
    console.error('Falha ao carregar progresso de jornadas para o card Continuar:', error.code, error.message);
    throw new Error('Não foi possível carregar o progresso de jornadas.');
  }

  return (data ?? []).map((linha) => ({
    jornadaSlug: linha.jornada_slug,
    sessaoId: linha.sessao_id,
    iniciadaEm: linha.iniciada_em,
    concluidaEm: linha.concluida_em,
  }));
}
