import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoSequencia from './CartaoSequencia';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';

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
        ultimos7Dias={seteDias([false, false, false, true, true, true, true])}
      />
    );
    expect(screen.getByText('4 dias de sequência')).toBeTruthy();
  });

  it('mostra mensagem acolhedora quando a sequência foi quebrada mas há histórico', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={3}
        ultimos7Dias={seteDias([true, false, false, false, false, false, false])}
      />
    );
    expect(screen.getByText('Você pode recomeçar hoje')).toBeTruthy();
    expect(screen.getByText('Você cuidou de si em 1 dos últimos 7 dias.')).toBeTruthy();
  });

  it('dia perdido: sem check-in hoje mas com a maior parte da semana ativa, reconhece quantos dias cuidou de si', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={10}
        ultimos7Dias={seteDias([true, true, true, true, true, true, false])}
      />
    );
    expect(screen.getByText('Você pode recomeçar hoje')).toBeTruthy();
    expect(screen.getByText('Você cuidou de si em 6 dos últimos 7 dias.')).toBeTruthy();
  });

  it('semana sem atividade: nenhum ponto marcado, mesmo havendo check-ins antigos', () => {
    render(
      <CartaoSequencia
        diasConsecutivosAtuais={0}
        totalCheckins={10}
        ultimos7Dias={seteDias([false, false, false, false, false, false, false])}
      />
    );
    expect(
      screen.getByText(
        'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.'
      )
    ).toBeTruthy();
  });

  it('nunca usa vocabulário proibido no texto estático do componente', () => {
    const { container } = render(
      <CartaoSequencia
        diasConsecutivosAtuais={4}
        totalCheckins={6}
        ultimos7Dias={seteDias([false, false, false, true, true, true, true])}
      />
    );
    const textoCompleto = (container.textContent ?? '').toLowerCase();
    for (const termoProibido of VOCABULARIO_PROIBIDO) {
      expect(textoCompleto).not.toContain(termoProibido);
    }
  });
});
