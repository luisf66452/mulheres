import { describe, it, expect } from 'vitest';
import {
  headlineParaObjetivo,
  validacaoParaIdentificacao,
  ajusteParaTemasSensiveis,
  confirmacaoParaTempoDisponivel,
} from './copyResultado';

describe('quiz — copyResultado', () => {
  it('headlineParaObjetivo monta a frase com o rótulo do objetivo', () => {
    expect(headlineParaObjetivo('fortalecer_autoestima')).toBe(
      'Seu plano: Fortalecer sua autoestima, 5 minutos por dia'
    );
  });

  it('headlineParaObjetivo usa frase genérica para a sentinela "decidir depois"', () => {
    expect(headlineParaObjetivo('decidir_depois')).toBe('Seu plano: Cuidar de você, 5 minutos por dia');
  });

  it('validacaoParaIdentificacao devolve uma frase por opção, sem número inventado', () => {
    const frase = validacaoParaIdentificacao('evita_espelho');
    expect(frase).toMatch(/mais comum do que parece/i);
    expect(frase).not.toMatch(/%|\d+\s*(mulheres|pessoas)/i);
  });

  it('ajusteParaTemasSensiveis prioriza o primeiro tema marcado, na ordem de TEMAS_SENSIVEIS', () => {
    expect(ajusteParaTemasSensiveis(['comparacao', 'alimentacao'])).toMatch(/sem dieta, sem contagem/i);
  });

  it('ajusteParaTemasSensiveis devolve mensagem genérica quando nenhum tema é reconhecido', () => {
    expect(ajusteParaTemasSensiveis([])).toBe('Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.');
    expect(ajusteParaTemasSensiveis(['nenhum_desses'])).toBe(
      'Seu plano é feito pra se encaixar do seu jeito, sem regras rígidas.'
    );
  });

  it('confirmacaoParaTempoDisponivel reforça viabilidade sem exigir reorganizar a rotina', () => {
    expect(confirmacaoParaTempoDisponivel('5_a_10min')).toBe(
      'Seu plano cabe em 5 a 10 minutos por dia — sem precisar reorganizar sua rotina.'
    );
  });
});
