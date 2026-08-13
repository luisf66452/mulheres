export interface EntradaProgresso {
  melhorSequencia: number;
  totalCheckins: number;
  totalPraticasConcluidas: number;
}

export type IconeConquista = 'sequencia' | 'checkin' | 'pratica';

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: IconeConquista;
  meta: number;
  valorAtual: (progresso: EntradaProgresso) => number;
}

export interface ConquistaAvaliada extends Conquista {
  atual: number;
  desbloqueada: boolean;
}
