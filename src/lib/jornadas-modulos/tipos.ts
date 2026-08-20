// Tipos do conteúdo estruturado de um módulo psicoeducativo (armazenado em
// jornada_atividades.conteudo_estruturado) e das respostas da usuária
// (jornada_respostas_modulo.respostas). Versionado via schemaVersion para que
// o formato possa evoluir sem quebrar módulos antigos já publicados.

export const SCHEMA_VERSION_MODULO_ATUAL = 1 as const;

export type TipoCampoExercicio =
  | 'texto_curto'
  | 'texto_longo'
  | 'escolha_unica'
  | 'multipla_escolha'
  | 'escala';

interface CampoBase {
  id: string;
  rotulo: string;
  opcional?: boolean;
}

export interface CampoTextoCurto extends CampoBase {
  tipo: 'texto_curto';
  placeholder?: string;
  maxCaracteres?: number;
}

export interface CampoTextoLongo extends CampoBase {
  tipo: 'texto_longo';
  placeholder?: string;
  maxCaracteres?: number;
}

export interface CampoEscolhaUnica extends CampoBase {
  tipo: 'escolha_unica';
  opcoes: string[];
}

export interface CampoMultiplaEscolha extends CampoBase {
  tipo: 'multipla_escolha';
  opcoes: string[];
}

export interface CampoEscala extends CampoBase {
  tipo: 'escala';
  min: number;
  max: number;
  rotuloMin: string;
  rotuloMax: string;
}

export type CampoExercicio =
  | CampoTextoCurto
  | CampoTextoLongo
  | CampoEscolhaUnica
  | CampoMultiplaEscolha
  | CampoEscala;

export type OperadorCondicaoFeedback =
  | 'igual'
  | 'diferente'
  | 'maior_ou_igual'
  | 'menor_ou_igual'
  | 'contem'
  | 'preenchido';

export interface CondicaoFeedback {
  campoId: string;
  operador: OperadorCondicaoFeedback;
  valor?: string | number;
}

export interface RegraFeedback {
  id: string;
  // Todas as condições precisam ser verdadeiras (AND) para a regra valer.
  condicoes: CondicaoFeedback[];
  texto: string;
}

export interface ReferenciaCientifica {
  afirmacao: string;
  referencia: string;
  link: string;
  aplicacao: string;
  limitacoes: string;
}

export interface ModuloEstruturadoV1 {
  schemaVersion: 1;
  objetivo: string;
  duracaoEstimadaMinutos: number;
  explicacao: string[];
  exemplo: { titulo: string; texto: string };
  exercicio: {
    introducao: string;
    campos: CampoExercicio[];
  };
  feedback: {
    regras: RegraFeedback[];
    padrao: string;
  };
  acaoPratica: string;
  resumo: string[];
  baseCientifica: ReferenciaCientifica[];
  avisoSeguranca?: string;
  // ids de campos texto_curto/texto_longo elegíveis para a varredura de
  // atenção por palavras-chave (ver deteccaoAtencao.ts).
  camposParaTriagem: string[];
}

export type ValorCampo = string | string[] | number | null;

export interface RespostaModuloV1 {
  schemaVersion: 1;
  valores: Record<string, ValorCampo>;
  finalizadoEm: string | null;
}
