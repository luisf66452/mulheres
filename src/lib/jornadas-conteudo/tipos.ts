// Estrutura central de dados da área de Jornadas (biblioteca de programas
// temáticos: Módulo > Sessão > Conteúdo). Mantida separada de
// `src/lib/jornadas`, que é o modelo mais antigo de jornada única
// sequencial (dia a dia) usado pelo widget "Continue sua jornada" da tela
// de início e pelo fluxo de check-in — os dois modelos não se sobrepõem.
//
// O conteúdo (título, texto, prática guiada) vive em código, não no banco —
// mesmo padrão já usado em `src/lib/praticas-conteudo/dados.ts` para as
// práticas rápidas. Só o PROGRESSO de cada usuária (o que ela começou/
// concluiu) é persistido, em `sessoes_jornadas_conteudo_progresso`
// (migração 0028) — ver `./progresso.ts`.

export type TipoConteudoSessao = 'reflexao' | 'escrita' | 'exercicio' | 'plano';

// Identificadores das referências científicas listadas na Fase 10 da tarefa
// (E1–E10) — ver `./referencias.ts` para o mapeamento completo.
export type IdReferenciaCientifica =
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
  | 'E6'
  | 'E7'
  | 'E8'
  | 'E9'
  | 'E10';

export interface Sessao {
  id: string;
  titulo: string;
  /** Descrição curta usada em listagens (cartão da sessão dentro do módulo). */
  descricaoCurta: string;
  duracaoMinutos: number;
  tipo: TipoConteudoSessao;
  /** Contexto/explicação breve no início da sessão — "por que isso importa", sem jargão. */
  entendaEm1Minuto: string;
  /** Passos da prática guiada, em ordem. */
  praticaGuiada: string[];
  /** Pergunta de reflexão opcional — nunca obrigatória para concluir. */
  reflexao?: string;
  /** Fechamento breve, o que a usuária leva consigo ao sair da sessão. */
  leveComVoce: string;
  fontesCientificas: IdReferenciaCientifica[];
  /** Só presente quando a sessão trata de tema que exige um aviso explícito (ex.: espelho, restrição alimentar, compulsão). */
  avisoSeguranca?: string;
  // Nunca preencher 'revisado' fora de uma revisão humana real da psicóloga
  // responsável — todo conteúdo novo nasce 'pendente' (ver Fase 8 da
  // tarefa). `revisadoPor`/`revisadoEm` só existem depois dessa revisão.
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
}

// Estado de uma sessão para UMA usuária específica — calculado em runtime a
// partir do progresso real (ver `./progresso.ts`), nunca armazenado junto do
// conteúdo.
export type EstadoSessao = 'disponivel' | 'em_andamento' | 'concluida' | 'bloqueada';
