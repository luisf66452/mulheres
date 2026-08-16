import { describe, it, expect } from 'vitest';
import { agregarResultadosPetalas } from './agregarResultadosPetalas';

describe('agregarResultadosPetalas', () => {
  it('soma as quantidades e ignora nulas', () => {
    const resultado = agregarResultadosPetalas([
      { quantidade: 10, limiteGratuitoAtingido: false },
      { quantidade: null, limiteGratuitoAtingido: false },
      { quantidade: 5, limiteGratuitoAtingido: false },
    ]);
    expect(resultado).toEqual({ total: 15, limiteGratuitoAtingido: false });
  });

  it('retorna limiteGratuitoAtingido true se qualquer resultado sinalizar o teto', () => {
    const resultado = agregarResultadosPetalas([
      { quantidade: 10, limiteGratuitoAtingido: false },
      { quantidade: null, limiteGratuitoAtingido: true },
    ]);
    expect(resultado).toEqual({ total: 10, limiteGratuitoAtingido: true });
  });

  it('retorna total zero e limiteGratuitoAtingido false para lista vazia', () => {
    const resultado = agregarResultadosPetalas([]);
    expect(resultado).toEqual({ total: 0, limiteGratuitoAtingido: false });
  });
});
