import { describe, it, expect } from 'vitest';
import { calcularProgressoJornada } from './progresso';

describe('calcularProgressoJornada', () => {
  it('incrementa um dia no meio da jornada sem concluir', () => {
    const resultado = calcularProgressoJornada(2, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 3, jornadaConcluida: false });
  });

  it('conclui a jornada ao completar o último dia', () => {
    const resultado = calcularProgressoJornada(6, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 7, jornadaConcluida: true });
  });

  it('não ultrapassa a duração mesmo se chamada de novo com o valor já no máximo (idempotência)', () => {
    const resultado = calcularProgressoJornada(7, 7);
    expect(resultado).toEqual({ novoDiasCompletados: 7, jornadaConcluida: true });
  });

  it('funciona igual para uma jornada de 21 dias', () => {
    const resultado = calcularProgressoJornada(20, 21);
    expect(resultado).toEqual({ novoDiasCompletados: 21, jornadaConcluida: true });
  });
});
