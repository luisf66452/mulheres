// Estrutura central de dados da área de Jornadas (biblioteca de programas
// temáticos: Módulo > Sessão > Conteúdo). Mantida separada de
// `src/lib/jornadas`, que é o modelo mais antigo de jornada única
// sequencial (dia a dia) usado pelo widget "Continue sua jornada" da tela
// de início e pelo fluxo de check-in — os dois modelos não se sobrepõem.

import { IdReferenciaCientifica } from './referencias';

export type TipoConteudoSessao = 'reflexao' | 'escrita' | 'exercicio' | 'plano';

export interface Sessao {
  id: string;
  titulo: string;
  descricaoCurta: string;
  duracaoMinutos: number; // 5-8
  tipo: TipoConteudoSessao;
  entendaEm1Minuto: string;
  praticaGuiada: string[]; // 3-5 steps
  reflexao?: string;
  leveComVoce: string;
  fontesCientificas: IdReferenciaCientifica[]; // length >= 1
  avisoSeguranca?: string;
  revisaoStatus: 'pendente' | 'revisado';
  revisadoPor?: string;
  revisadoEm?: string;
}

export interface Modulo {
  id: string;
  titulo: string;
  sessoes: Sessao[];
}

export type JornadaCorCartao = 'pessego' | 'creme-rosado' | 'lilas' | 'salvia';

export interface Jornada {
  id: string;
  slug: string;
  titulo: string;
  descricaoCurta: string;
  corCartao: JornadaCorCartao;
  modulos: Modulo[];
  // progressoPercentual removed — always computed per-user, never stored here
}

export type EstadoSessao = 'disponivel' | 'em_andamento' | 'concluida' | 'bloqueada';
