import { describe, it, expect } from 'vitest';
import { normalizarNome } from './nome';

describe('normalizarNome', () => {
  it('mantém um nome válido sem espaços nas pontas', () => {
    expect(normalizarNome('Sofia')).toBe('Sofia');
  });

  it('remove espaços nas pontas', () => {
    expect(normalizarNome('  Sofia  ')).toBe('Sofia');
  });

  it('retorna null para string vazia', () => {
    expect(normalizarNome('')).toBeNull();
  });

  it('retorna null para string só com espaços', () => {
    expect(normalizarNome('   ')).toBeNull();
  });

  it('preserva espaços internos', () => {
    expect(normalizarNome('  Maria Clara  ')).toBe('Maria Clara');
  });
});
