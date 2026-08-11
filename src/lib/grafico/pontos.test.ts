import { describe, it, expect } from 'vitest';
import { calcularPontosLinha } from './pontos';

describe('calcularPontosLinha', () => {
  it('retorna lista vazia para entrada vazia', () => {
    expect(calcularPontosLinha([], 100, 100)).toEqual([]);
  });

  it('coloca um único valor no meio horizontalmente (x=0) e na altura correspondente', () => {
    const pontos = calcularPontosLinha([3], 100, 100);
    expect(pontos).toHaveLength(1);
    expect(pontos[0].x).toBe(0);
    expect(pontos[0].y).toBe(50); // (3-1)/(5-1) = 0.5 → altura - 0.5*altura = 50
  });

  it('valor máximo (5) fica no topo (y=0)', () => {
    const pontos = calcularPontosLinha([5, 5], 100, 100);
    expect(pontos[0].y).toBe(0);
    expect(pontos[1].y).toBe(0);
  });

  it('valor mínimo (1) fica embaixo (y=altura)', () => {
    const pontos = calcularPontosLinha([1, 1], 100, 100);
    expect(pontos[0].y).toBe(100);
    expect(pontos[1].y).toBe(100);
  });

  it('espaça os pontos igualmente no eixo x', () => {
    const pontos = calcularPontosLinha([3, 3, 3], 100, 100);
    expect(pontos.map((p) => p.x)).toEqual([0, 50, 100]);
  });

  it('primeiro e último valor sempre nas bordas do eixo x', () => {
    const pontos = calcularPontosLinha([1, 5, 1, 5, 1], 200, 100);
    expect(pontos[0].x).toBe(0);
    expect(pontos[pontos.length - 1].x).toBe(200);
  });
});
