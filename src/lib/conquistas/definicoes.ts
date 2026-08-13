import type { Conquista, ConquistaAvaliada, EntradaProgresso } from './tipos';

export const CONQUISTAS: Conquista[] = [
  {
    id: 'sequencia-7-dias',
    titulo: '7 dias de sequência',
    descricao: 'Você manteve consistência no seu cuidado.',
    icone: 'sequencia',
    meta: 7,
    valorAtual: (p) => p.melhorSequencia,
  },
  {
    id: 'checkins-5',
    titulo: '5 check-ins realizados',
    descricao: 'Você se conectou com suas emoções.',
    icone: 'checkin',
    meta: 5,
    valorAtual: (p) => p.totalCheckins,
  },
  {
    id: 'praticas-3',
    titulo: '3 práticas concluídas',
    descricao: 'Pequenos passos, grandes transformações.',
    icone: 'pratica',
    meta: 3,
    valorAtual: (p) => p.totalPraticasConcluidas,
  },
];

export function avaliarConquistas(progresso: EntradaProgresso): ConquistaAvaliada[] {
  return CONQUISTAS.map((conquista) => {
    const atual = conquista.valorAtual(progresso);
    return {
      ...conquista,
      atual: Math.min(atual, conquista.meta),
      desbloqueada: atual >= conquista.meta,
    };
  });
}
