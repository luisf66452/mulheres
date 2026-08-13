import { describe, it, expect } from 'vitest';
import { avaliarConquistas, CONQUISTAS } from './definicoes';

describe('avaliarConquistas', () => {
  it('mantém todas bloqueadas quando não há nenhum progresso', () => {
    const resultado = avaliarConquistas({ melhorSequencia: 0, totalCheckins: 0, totalPraticasConcluidas: 0 });
    expect(resultado.every((c) => c.desbloqueada === false)).toBe(true);
    expect(resultado.find((c) => c.id === 'checkins-5')?.atual).toBe(0);
  });

  it('desbloqueia a conquista de sequência ao atingir 7 dias de melhor sequência', () => {
    const resultado = avaliarConquistas({ melhorSequencia: 7, totalCheckins: 0, totalPraticasConcluidas: 0 });
    expect(resultado.find((c) => c.id === 'sequencia-7-dias')?.desbloqueada).toBe(true);
  });

  it('mantém a conquista de sequência desbloqueada mesmo com a sequência atual quebrada, pois usa a melhor sequência já alcançada', () => {
    const resultado = avaliarConquistas({ melhorSequencia: 10, totalCheckins: 0, totalPraticasConcluidas: 0 });
    expect(resultado.find((c) => c.id === 'sequencia-7-dias')?.desbloqueada).toBe(true);
  });

  it('desbloqueia a conquista de check-ins a partir de 5', () => {
    expect(
      avaliarConquistas({ melhorSequencia: 0, totalCheckins: 5, totalPraticasConcluidas: 0 }).find(
        (c) => c.id === 'checkins-5'
      )?.desbloqueada
    ).toBe(true);
    expect(
      avaliarConquistas({ melhorSequencia: 0, totalCheckins: 4, totalPraticasConcluidas: 0 }).find(
        (c) => c.id === 'checkins-5'
      )?.desbloqueada
    ).toBe(false);
  });

  it('desbloqueia a conquista de práticas a partir de 3', () => {
    expect(
      avaliarConquistas({ melhorSequencia: 0, totalCheckins: 0, totalPraticasConcluidas: 3 }).find(
        (c) => c.id === 'praticas-3'
      )?.desbloqueada
    ).toBe(true);
  });

  it('limita "atual" à meta para não exibir progresso além de 100%', () => {
    const resultado = avaliarConquistas({ melhorSequencia: 20, totalCheckins: 0, totalPraticasConcluidas: 0 });
    expect(resultado.find((c) => c.id === 'sequencia-7-dias')?.atual).toBe(7);
  });

  it('expõe exatamente as 3 conquistas do MVP, na ordem da referência visual', () => {
    expect(CONQUISTAS.map((c) => c.id)).toEqual(['sequencia-7-dias', 'checkins-5', 'praticas-3']);
  });
});
