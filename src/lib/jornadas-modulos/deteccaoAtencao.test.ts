import { describe, it, expect } from 'vitest';
import { detectarSinalDeAtencao } from './deteccaoAtencao';

describe('detectarSinalDeAtencao', () => {
  it('retorna false para texto neutro', () => {
    expect(detectarSinalDeAtencao('Hoje foi um dia tranquilo, consegui estudar de manhã.')).toBe(false);
  });

  it('retorna false para texto vazio ou ausente', () => {
    expect(detectarSinalDeAtencao('')).toBe(false);
    expect(detectarSinalDeAtencao('   ')).toBe(false);
    expect(detectarSinalDeAtencao(null)).toBe(false);
    expect(detectarSinalDeAtencao(undefined)).toBe(false);
  });

  it('detecta termos de risco de vida mesmo em minúsculas simples', () => {
    expect(detectarSinalDeAtencao('as vezes eu penso que quero morrer')).toBe(true);
  });

  it('ignora maiúsculas e acentuação', () => {
    expect(detectarSinalDeAtencao('ÀS VEZES SINTO QUE NÃO AGUENTO MAIS VIVER')).toBe(true);
    expect(detectarSinalDeAtencao('não aguento mais viver')).toBe(true);
  });

  it('detecta termos de automutilação', () => {
    expect(detectarSinalDeAtencao('ontem tive vontade de me cortar de novo')).toBe(true);
  });

  it('detecta termos de violência/abuso', () => {
    expect(detectarSinalDeAtencao('ele me bate quando bebe')).toBe(true);
    expect(detectarSinalDeAtencao('tenho medo dele quando chega em casa')).toBe(true);
  });

  it('detecta termos de comportamento de risco alimentar', () => {
    expect(detectarSinalDeAtencao('não consigo parar de comer e depois me sinto mal')).toBe(true);
  });

  it('não gera falso positivo para palavras parecidas mas inofensivas', () => {
    expect(detectarSinalDeAtencao('cortei o cabelo hoje e gostei do resultado')).toBe(false);
  });
});
