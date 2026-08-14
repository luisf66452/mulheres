import { describe, it, expect } from 'vitest';
import { ehPrimeiraConclusao } from './primeiraConclusao';

describe('ehPrimeiraConclusao', () => {
  it('retorna true quando não há sessões anteriores (array vazio)', () => {
    expect(ehPrimeiraConclusao([])).toBe(true);
  });

  it('retorna true quando o valor é null', () => {
    expect(ehPrimeiraConclusao(null)).toBe(true);
  });

  it('retorna true quando o valor é undefined', () => {
    expect(ehPrimeiraConclusao(undefined)).toBe(true);
  });

  it('retorna false quando já existe ao menos uma sessão anterior', () => {
    expect(ehPrimeiraConclusao([{ id: 'a' }])).toBe(false);
  });

  it('retorna false quando existem várias sessões anteriores', () => {
    expect(ehPrimeiraConclusao([{ id: 'a' }, { id: 'b' }])).toBe(false);
  });
});
