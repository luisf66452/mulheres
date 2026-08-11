import { describe, it, expect } from 'vitest';
import { derivarHumor, derivarImagemCorporal, derivarComida } from './derivacoes';

describe('derivarHumor', () => {
  it('quadrante confortável com intensidade alta dá 5', () => {
    expect(derivarHumor('baixa_energia_conforto', 5)).toBe(5);
    expect(derivarHumor('alta_energia_conforto', 4)).toBe(5);
  });

  it('quadrante confortável com intensidade baixa dá 4', () => {
    expect(derivarHumor('baixa_energia_conforto', 1)).toBe(4);
    expect(derivarHumor('alta_energia_conforto', 2)).toBe(4);
  });

  it('intensidade 3 dá sempre 3, independente do quadrante', () => {
    expect(derivarHumor('alta_energia_conforto', 3)).toBe(3);
    expect(derivarHumor('alta_energia_desconforto', 3)).toBe(3);
    expect(derivarHumor('baixa_energia_conforto', 3)).toBe(3);
    expect(derivarHumor('baixa_energia_desconforto', 3)).toBe(3);
  });

  it('quadrante desconfortável com intensidade baixa dá 2', () => {
    expect(derivarHumor('baixa_energia_desconforto', 1)).toBe(2);
    expect(derivarHumor('alta_energia_desconforto', 2)).toBe(2);
  });

  it('quadrante desconfortável com intensidade alta dá 1', () => {
    expect(derivarHumor('baixa_energia_desconforto', 5)).toBe(1);
    expect(derivarHumor('alta_energia_desconforto', 4)).toBe(1);
  });
});

describe('derivarImagemCorporal', () => {
  it('preserva a direção da escala nos extremos e no meio', () => {
    expect(derivarImagemCorporal(1)).toBe(1);
    expect(derivarImagemCorporal(3)).toBe(3);
    expect(derivarImagemCorporal(5)).toBe(5);
  });
});

describe('derivarComida', () => {
  it('mapeia cada resposta para o valor exato especificado', () => {
    expect(derivarComida('tranquila')).toBe(5);
    expect(derivarComida('satisfeita')).toBe(5);
    expect(derivarComida('indiferente')).toBe(4);
    expect(derivarComida('confusa')).toBe(3);
    expect(derivarComida('ansiosa')).toBe(2);
    expect(derivarComida('culpada')).toBe(2);
    expect(derivarComida('vontade_punir')).toBe(1);
    expect(derivarComida('prefiro_nao_responder')).toBe(null);
  });
});
