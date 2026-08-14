import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoSequencia from './CartaoSequencia';

const seteDias = (completos: boolean[]) =>
  completos.map((completou, i) => ({ data: `2026-08-1${i}`, completou }));

describe('CartaoSequencia', () => {
  it('mostra a mensagem de início e nenhum ponto preenchido quando não há check-ins', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={0}
        ultimos7Dias={seteDias([false, false, false, false, false, false, false])}
      />
    );
    expect(screen.getByText('Comece hoje sua jornada')).toBeTruthy();
  });

  it('mostra o título com o número real de dias consecutivos, não um valor fixo', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={4}
        totalCheckins={6}
        ultimos7Dias={seteDias([true, true, true, true, false, false, false])}
      />
    );
    expect(screen.getByText('4 dias de sequência')).toBeTruthy();
  });

  it('mostra mensagem acolhedora quando a sequência foi quebrada mas há histórico', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={3}
        ultimos7Dias={seteDias([false, false, false, false, false, false, false])}
      />
    );
    expect(screen.getByText('Cada retorno também faz parte da jornada.')).toBeTruthy();
  });
});
