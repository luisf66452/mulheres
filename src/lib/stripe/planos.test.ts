// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatarPrecoExibicao, obterMoedaELocaleDoPais } from './planos';

describe('obterMoedaELocaleDoPais', () => {
  it('retorna BRL e locale pt-BR para o Brasil', () => {
    expect(obterMoedaELocaleDoPais('BR')).toEqual({ moeda: 'brl', locale: 'pt-BR' });
  });

  it('retorna EUR e locale pt para Portugal', () => {
    expect(obterMoedaELocaleDoPais('PT')).toEqual({ moeda: 'eur', locale: 'pt' });
  });

  it('cai no fallback seguro (Portugal/EUR) quando o país é nulo', () => {
    expect(obterMoedaELocaleDoPais(null)).toEqual({ moeda: 'eur', locale: 'pt' });
  });

  it('cai no fallback seguro (Portugal/EUR) quando o país não é reconhecido', () => {
    expect(obterMoedaELocaleDoPais('XX')).toEqual({ moeda: 'eur', locale: 'pt' });
  });
});

describe('formatarPrecoExibicao', () => {
  it('formata BRL em unit_amount de centavos como "R$ 39,99"', () => {
    expect(formatarPrecoExibicao(3999, 'brl')).toBe('R$ 39,99');
  });

  it('formata EUR em unit_amount de centavos como "9,99 €"', () => {
    expect(formatarPrecoExibicao(999, 'eur')).toBe('9,99 €');
  });
});
