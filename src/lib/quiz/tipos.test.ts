import { describe, it, expect } from 'vitest';
import {
  IDENTIFICACAO_OPCOES,
  FREQUENCIA_EMOCIONAL_OPCOES,
  TEMPO_DISPONIVEL_OPCOES,
  ehIdentificacaoValida,
  ehFrequenciaEmocionalValida,
  ehTempoDisponivelValido,
} from './tipos';

describe('quiz — tipos', () => {
  it('tem as 4 opções de identificação, na ordem', () => {
    expect(IDENTIFICACAO_OPCOES.map((o) => o.rotulo)).toEqual([
      'Eu me comparo com outras mulheres o tempo todo',
      'Eu evito me olhar no espelho',
      'Eu sei que preciso me cuidar mais, mas não sei por onde começar',
      'Eu já cuido de mim, mas quero ir mais fundo',
    ]);
  });

  it('tem as 4 opções de frequência emocional, na ordem', () => {
    expect(FREQUENCIA_EMOCIONAL_OPCOES.map((o) => o.rotulo)).toEqual([
      'Quase todo dia',
      'Algumas vezes por semana',
      'De vez em quando',
      'Raramente',
    ]);
  });

  it('tem as 3 opções de tempo disponível, na ordem', () => {
    expect(TEMPO_DISPONIVEL_OPCOES.map((o) => o.rotulo)).toEqual([
      'Menos de 5 minutos',
      '5 a 10 minutos',
      'Mais de 10 minutos',
    ]);
  });

  it('validadores aceitam só ids conhecidos', () => {
    expect(ehIdentificacaoValida('evita_espelho')).toBe(true);
    expect(ehIdentificacaoValida('outro')).toBe(false);
    expect(ehFrequenciaEmocionalValida('quase_todo_dia')).toBe(true);
    expect(ehFrequenciaEmocionalValida('outro')).toBe(false);
    expect(ehTempoDisponivelValido('5_a_10min')).toBe(true);
    expect(ehTempoDisponivelValido('outro')).toBe(false);
  });
});
