import { describe, expect, it } from 'vitest';
import { REFERENCIAS } from './referencias';

describe('REFERENCIAS', () => {
  it('every entry has all required fields non-empty', () => {
    Object.values(REFERENCIAS).forEach((ref) => {
      expect(ref.titulo.length).toBeGreaterThan(0);
      expect(ref.autoresOuInstituicao.length).toBeGreaterThan(0);
      expect(ref.link).toMatch(/^https:\/\//);
      expect(ref.resumoSimples.length).toBeGreaterThan(20);
      expect(ref.sustenta.length).toBeGreaterThan(0);
      expect(ref.limitacoes.length).toBeGreaterThan(10);
    });
  });

  it('has at least 30 entries covering all 4 journeys worth of sources', () => {
    expect(Object.keys(REFERENCIAS).length).toBeGreaterThanOrEqual(30);
  });

  it('no entry claims certainty language', () => {
    const proibidas = /\bcomprovad|garantid|\bcura\b|vai reduzir/i;
    Object.values(REFERENCIAS).forEach((ref) => {
      expect(ref.resumoSimples).not.toMatch(proibidas);
    });
  });
});
