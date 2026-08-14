import { describe, it, expect } from 'vitest';
import { obterIndiceFrase } from './frasesMeditacao';

describe('obterIndiceFrase', () => {
  it('começa na primeira frase', () => {
    expect(obterIndiceFrase(0, 8)).toBe(0);
  });

  it('avança para a próxima frase só depois do intervalo completo', () => {
    expect(obterIndiceFrase(39, 8)).toBe(0);
    expect(obterIndiceFrase(40, 8)).toBe(1);
    expect(obterIndiceFrase(79, 8)).toBe(1);
    expect(obterIndiceFrase(80, 8)).toBe(2);
  });

  it('roda em loop quando passa da última frase', () => {
    expect(obterIndiceFrase(40 * 8, 8)).toBe(0);
  });
});
