import { describe, it, expect } from 'vitest';
import { calcularModuloSessao } from './moduloSessao';

describe('calcularModuloSessao', () => {
  it('dia 1 é módulo 1, sessão 1', () => {
    expect(calcularModuloSessao(1)).toEqual({ modulo: 1, sessao: 1 });
  });

  it('dia 7 é módulo 1, sessão 7 (fim do primeiro módulo)', () => {
    expect(calcularModuloSessao(7)).toEqual({ modulo: 1, sessao: 7 });
  });

  it('dia 8 é módulo 2, sessão 1 (início do segundo módulo)', () => {
    expect(calcularModuloSessao(8)).toEqual({ modulo: 2, sessao: 1 });
  });

  it('dia 10 é módulo 2, sessão 3', () => {
    expect(calcularModuloSessao(10)).toEqual({ modulo: 2, sessao: 3 });
  });

  it('dia 14 é módulo 2, sessão 7', () => {
    expect(calcularModuloSessao(14)).toEqual({ modulo: 2, sessao: 7 });
  });

  it('dia 15 é módulo 3, sessão 1', () => {
    expect(calcularModuloSessao(15)).toEqual({ modulo: 3, sessao: 1 });
  });
});
