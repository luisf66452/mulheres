// Estrutura central de dados da área de Jornadas (biblioteca de programas
// temáticos: Módulo > Sessão > Conteúdo). Mantida separada de
// `src/lib/jornadas`, que é o modelo mais antigo de jornada única
// sequencial (dia a dia) usado pelo widget "Continue sua jornada" da tela
// de início e pelo fluxo de check-in — os dois modelos não se sobrepõem.

export type TipoConteudoSessao = 'video' | 'audio' | 'texto' | 'exercicio' | 'reflexao';

export interface ConteudoSessao {
  tipo: TipoConteudoSessao;
  url: string | null;
  textoMarkdown: string | null;
}

export interface Sessao {
  id: string;
  titulo: string;
  descricao: string;
  duracaoMinutos: number | null;
  miniaturaUrl: string | null;
  conteudo: ConteudoSessao | null;
  concluida: boolean;
  bloqueada: boolean;
  progresso: number;
  ultimaAtividadeEm: string | null;
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
  progressoPercentual: number;
  temasFuturos: string[];
  modulos: Modulo[];
}
