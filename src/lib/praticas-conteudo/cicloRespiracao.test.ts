import { describe, it, expect } from 'vitest';
import { calcularFaseRespiracao, DURACAO_CICLO_S } from './cicloRespiracao';

describe('calcularFaseRespiracao', () => {
  it('está em inspire no início do ciclo', () => {
    expect(calcularFaseRespiracao(0).fase).toBe('inspire');
    expect(calcularFaseRespiracao(0).progressoFase).toBe(0);
  });

  it('está em expire logo após os 4s de inspiração', () => {
    expect(calcularFaseRespiracao(4).fase).toBe('expire');
    expect(calcularFaseRespiracao(4).progressoFase).toBe(0);
  });

  it('avança dentro da fase de expiração proporcionalmente', () => {
    expect(calcularFaseRespiracao(7).fase).toBe('expire');
    expect(calcularFaseRespiracao(7).progressoFase).toBeCloseTo(0.5, 5);
  });

  it('reinicia o ciclo (volta para inspire) depois de 10s', () => {
    expect(calcularFaseRespiracao(9.9).fase).toBe('expire');
    expect(calcularFaseRespiracao(10).fase).toBe('inspire');
  });

  it('o ciclo de 10s cabe um número inteiro de vezes em 3 minutos', () => {
    expect(180 % DURACAO_CICLO_S).toBe(0);
    expect(calcularFaseRespiracao(170).fase).toBe('inspire');
  });
});
