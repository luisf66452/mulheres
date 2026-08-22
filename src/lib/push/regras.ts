// Regras puras de geração de candidatos a notificação. Cada função só decide
// SE e O QUÊ notificar a partir de um retrato do progresso da usuária — toda
// leitura do Supabase acontece antes, em api/push/send-due/route.ts. Manter
// isso puro é o que permite testar as regras de negócio (quando abandonar
// conta como abandonada, quando parar de insistir) sem precisar de um banco.
//
// Nunca gera candidato para: sessão bloqueada, sessão já concluída, ou
// qualquer coisa fora do progresso real da usuária — cada função abaixo só
// enxerga sessões no estado relevante, então uma sessão bloqueada
// simplesmente não aparece na lista de entrada (ver
// calcularEstadosSessoes em jornadas-conteudo/progresso.ts).
import type { EstadoSessao, TipoConteudoSessao } from '@/lib/jornadas-conteudo/tipos';
import type { CategoriaPushNotificacao } from '@/lib/supabase/types';

export interface SessaoContexto {
  sessaoId: string;
  jornadaSlug: string;
  tipo: TipoConteudoSessao;
  estado: EstadoSessao;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  /** true quando esta é a sessão seguinte, na ordem da jornada, a uma que acabou de ser concluída. */
  proximaDeUmaConclusao: boolean;
}

export interface CandidatoNotificacao {
  categoria: CategoriaPushNotificacao;
  dedupKey: string;
  url: string;
}

const UMA_HORA_MS = 60 * 60 * 1000;

function horasDesde(iso: string, agora: Date): number {
  return (agora.getTime() - new Date(iso).getTime()) / UMA_HORA_MS;
}

/** Sessão iniciada e abandonada: incompleta há pelo menos algumas horas. */
export function avaliarSessaoAbandonada(
  sessoes: SessaoContexto[],
  agora: Date,
  horasMinimas = 3
): CandidatoNotificacao[] {
  return sessoes
    .filter((s) => s.estado === 'em_andamento' && s.iniciadaEm && horasDesde(s.iniciadaEm, agora) >= horasMinimas)
    .map((s) => ({
      categoria: 'sessao_abandonada' as const,
      dedupKey: `sessao_abandonada:${s.sessaoId}`,
      url: `/jornadas/${s.jornadaSlug}/${s.sessaoId}`,
    }));
}

/**
 * Exercício/reflexão pendente: mesma ideia de "incompleta", mas restrita a
 * conteúdo reflexivo/de exercício e com um prazo maior (dia seguinte) — a
 * dedup_key própria impede que a mesma sessão dispare tanto esta quanto
 * `avaliarSessaoAbandonada` no mesmo dia (o limite de frequência global
 * também protegeria, mas a intenção aqui já é ser uma pendência distinta).
 */
export function avaliarPraticaPendente(
  sessoes: SessaoContexto[],
  agora: Date,
  horasMinimas = 24
): CandidatoNotificacao[] {
  const tiposReflexivos: TipoConteudoSessao[] = ['reflexao', 'escrita', 'exercicio'];
  return sessoes
    .filter(
      (s) =>
        tiposReflexivos.includes(s.tipo) &&
        s.estado === 'em_andamento' &&
        s.iniciadaEm &&
        horasDesde(s.iniciadaEm, agora) >= horasMinimas
    )
    .map((s) => ({
      categoria: 'praticas_pendente' as const,
      dedupKey: `praticas_pendente:${s.sessaoId}`,
      url: `/jornadas/${s.jornadaSlug}/${s.sessaoId}`,
    }));
}

/**
 * Sessão disponível e não iniciada: lembrete diário suave, só quando existe
 * mesmo uma sessão desbloqueada esperando E a usuária não está com nenhuma
 * sessão em andamento (evita insistir enquanto ela já está no meio de algo).
 * Uma candidata por jornada por dia local — `dataLocalHoje` faz parte da
 * dedup_key de propósito, pra permitir (no máximo) um lembrete por dia.
 */
export function avaliarSessaoDisponivel(sessoes: SessaoContexto[], dataLocalHoje: string): CandidatoNotificacao[] {
  const emAndamentoPorJornada = new Set(sessoes.filter((s) => s.estado === 'em_andamento').map((s) => s.jornadaSlug));

  const disponiveisPorJornada = new Map<string, SessaoContexto>();
  for (const s of sessoes) {
    if (s.estado === 'disponivel' && !emAndamentoPorJornada.has(s.jornadaSlug) && !disponiveisPorJornada.has(s.jornadaSlug)) {
      disponiveisPorJornada.set(s.jornadaSlug, s);
    }
  }

  return [...disponiveisPorJornada.values()].map((s) => ({
    categoria: 'sessao_disponivel' as const,
    dedupKey: `sessao_disponivel:${s.jornadaSlug}:${dataLocalHoje}`,
    url: `/jornadas/${s.jornadaSlug}`,
  }));
}

/**
 * Continuidade da jornada: quando concluir uma sessão libera a próxima e ela
 * ainda não foi iniciada depois de um tempo — um empurrãozinho pontual,
 * separado do lembrete diário genérico de `avaliarSessaoDisponivel`.
 */
export function avaliarContinuidade(
  sessoes: SessaoContexto[],
  agora: Date,
  horasMinimas = 20
): CandidatoNotificacao[] {
  return sessoes
    .filter((s) => s.estado === 'disponivel' && s.proximaDeUmaConclusao)
    .map((s) => {
      const sessaoAnteriorConcluida = sessoes.find(
        (outra) => outra.jornadaSlug === s.jornadaSlug && outra.concluidaEm && outra.estado === 'concluida'
      );
      return { sessao: s, concluidaEm: sessaoAnteriorConcluida?.concluidaEm ?? null };
    })
    .filter(({ concluidaEm }) => concluidaEm !== null && horasDesde(concluidaEm, agora) >= horasMinimas)
    .map(({ sessao }) => ({
      categoria: 'continuidade' as const,
      dedupKey: `continuidade:${sessao.sessaoId}`,
      url: `/jornadas/${sessao.jornadaSlug}/${sessao.sessaoId}`,
    }));
}

export type EstagioInatividade = 'nenhum' | 'primeiro' | 'segundo';

/**
 * Inatividade: 1º lembrete aos 3 dias sem atividade, 2º aos 7 dias, depois
 * silêncio até ela voltar (voltar = `ultimaAtividadeEm` mudar, o que muda a
 * dedup_key e reabre a possibilidade de um novo ciclo 3→7).
 */
export function avaliarInatividade(ultimaAtividadeEm: Date | null, agora: Date): CandidatoNotificacao[] {
  if (!ultimaAtividadeEm) return [];

  const diasSemAtividade = Math.floor((agora.getTime() - ultimaAtividadeEm.getTime()) / (24 * UMA_HORA_MS));
  const chaveEpisodio = ultimaAtividadeEm.toISOString().slice(0, 10);

  let estagio: EstagioInatividade = 'nenhum';
  if (diasSemAtividade >= 7) estagio = 'segundo';
  else if (diasSemAtividade >= 3) estagio = 'primeiro';

  if (estagio === 'nenhum') return [];

  const sufixo = estagio === 'primeiro' ? '3d' : '7d';
  return [
    {
      categoria: 'inatividade' as const,
      dedupKey: `inatividade_${sufixo}:${chaveEpisodio}`,
      url: '/inicio',
    },
  ];
}
