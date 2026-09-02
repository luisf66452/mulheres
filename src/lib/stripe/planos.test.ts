// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { formatarPrecoExibicao, obterMoedaELocaleDoPais, obterPriceIdEbook, ebookConfigurado } from './planos';

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

describe('obterPriceIdEbook', () => {
  it('retorna o price id do ebook quando STRIPE_PRICE_ID_EBOOK está configurado', () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(obterPriceIdEbook()).toBe('price_ebook_teste');
  });

  it('retorna null quando STRIPE_PRICE_ID_EBOOK não está configurado', () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    expect(obterPriceIdEbook()).toBeNull();
  });
});

describe('ebookConfigurado', () => {
  it('retorna true quando STRIPE_SECRET_KEY e STRIPE_PRICE_ID_EBOOK estão presentes', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(ebookConfigurado()).toBe(true);
  });

  it('retorna false quando STRIPE_PRICE_ID_EBOOK está ausente', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    expect(ebookConfigurado()).toBe(false);
  });

  it('retorna false quando STRIPE_SECRET_KEY está ausente', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
    expect(ebookConfigurado()).toBe(false);
  });
});
