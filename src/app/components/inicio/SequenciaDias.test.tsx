import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SequenciaDias from './SequenciaDias';
import type { Progresso7Dias } from '@/lib/progress/streak';

const progressoComDias = (completos: boolean[]): Progresso7Dias => {
  const ultimos7Dias = completos.map((completou, i) => ({ data: `2026-08-1${i}`, completou }));
  let diasConsecutivosAtuais = 0;
  for (let i = ultimos7Dias.length - 1; i >= 0; i--) {
    if (ultimos7Dias[i].completou) diasConsecutivosAtuais++;
    else break;
  }
  return {
    diasCompletos: completos.filter(Boolean).length,
    diasConsecutivosAtuais,
    ultimos7Dias,
  };
};

describe('SequenciaDias', () => {
  it('mostra a mensagem de início no primeiro check-in', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([false, false, false, false, false, false, false])}
        totalCheckins={0}
      />
    );
    expect(screen.getByText('Comece hoje sua jornada')).toBeTruthy();
  });

  it('mostra o número real de dias consecutivos quando há check-in hoje', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([true, true, true, true, false, false, true])}
        totalCheckins={8}
      />
    );
    expect(screen.getByText('1 dia de sequência')).toBeTruthy();
  });

  it('dia perdido: sem check-in hoje, reconhece quantos dias cuidou de si na semana', () => {
    render(
      <SequenciaDias
        progresso={progressoComDias([true, true, true, true, true, true, false])}
        totalCheckins={10}
      />
    );
    expect(screen.getByText('Você pode recomeçar hoje')).toBeTruthy();
    expect(screen.getByText('Você cuidou de si em 6 dos últimos 7 dias.')).toBeTruthy();
  });
});
