// Perguntas 1, 2 e 5 do quiz de /comecar — nunca gravadas no banco, só usadas
// para moldar a cópia da tela de resultado (ver spec 2026-08-31). Objetivo e
// temas sensíveis (perguntas 3 e 4) reaproveitam os tipos fechados já
// existentes em src/lib/perfil/personalizacao.ts.
import type { ObjetivoId, TemaSensivelId } from '@/lib/perfil/personalizacao';

export type IdentificacaoId = 'compara' | 'evita_espelho' | 'nao_sabe_comecar' | 'quer_ir_mais_fundo';

export const IDENTIFICACAO_OPCOES: { id: IdentificacaoId; rotulo: string }[] = [
  { id: 'compara', rotulo: 'Eu me comparo com outras mulheres o tempo todo' },
  { id: 'evita_espelho', rotulo: 'Eu evito me olhar no espelho' },
  { id: 'nao_sabe_comecar', rotulo: 'Eu sei que preciso me cuidar mais, mas não sei por onde começar' },
  { id: 'quer_ir_mais_fundo', rotulo: 'Eu já cuido de mim, mas quero ir mais fundo' },
];

const IDENTIFICACAO_IDS = IDENTIFICACAO_OPCOES.map((o) => o.id);

export function ehIdentificacaoValida(valor: string): valor is IdentificacaoId {
  return (IDENTIFICACAO_IDS as string[]).includes(valor);
}

export type FrequenciaEmocionalId = 'quase_todo_dia' | 'algumas_vezes_semana' | 'de_vez_em_quando' | 'raramente';

export const FREQUENCIA_EMOCIONAL_OPCOES: { id: FrequenciaEmocionalId; rotulo: string }[] = [
  { id: 'quase_todo_dia', rotulo: 'Quase todo dia' },
  { id: 'algumas_vezes_semana', rotulo: 'Algumas vezes por semana' },
  { id: 'de_vez_em_quando', rotulo: 'De vez em quando' },
  { id: 'raramente', rotulo: 'Raramente' },
];

const FREQUENCIA_EMOCIONAL_IDS = FREQUENCIA_EMOCIONAL_OPCOES.map((o) => o.id);

export function ehFrequenciaEmocionalValida(valor: string): valor is FrequenciaEmocionalId {
  return (FREQUENCIA_EMOCIONAL_IDS as string[]).includes(valor);
}

export type TempoDisponivelId = 'menos_5min' | '5_a_10min' | 'mais_10min';

export const TEMPO_DISPONIVEL_OPCOES: { id: TempoDisponivelId; rotulo: string }[] = [
  { id: 'menos_5min', rotulo: 'Menos de 5 minutos' },
  { id: '5_a_10min', rotulo: '5 a 10 minutos' },
  { id: 'mais_10min', rotulo: 'Mais de 10 minutos' },
];

const TEMPO_DISPONIVEL_IDS = TEMPO_DISPONIVEL_OPCOES.map((o) => o.id);

export function ehTempoDisponivelValido(valor: string): valor is TempoDisponivelId {
  return (TEMPO_DISPONIVEL_IDS as string[]).includes(valor);
}

export type RespostasQuiz = {
  identificacao: IdentificacaoId;
  frequenciaEmocional: FrequenciaEmocionalId;
  objetivo: ObjetivoId;
  temasSensiveis: TemaSensivelId[];
  tempoDisponivel: TempoDisponivelId;
};
