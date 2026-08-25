import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MelhorSequencia from './MelhorSequencia';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';

describe('MelhorSequencia', () => {
  it('não renderiza nada quando não há nenhuma sequência (sem check-ins)', () => {
    const { container } = render(<MelhorSequencia melhorSequencia={0} totalCheckins={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra a melhor sequência e o total acumulado de check-ins', () => {
    render(<MelhorSequencia melhorSequencia={5} totalCheckins={23} />);
    expect(screen.getByText('5 dias seguidos')).toBeTruthy();
    expect(screen.getByText('23')).toBeTruthy();
  });

  it('reflete o total real de check-ins recebido, nunca um valor fixo', () => {
    render(<MelhorSequencia melhorSequencia={1} totalCheckins={1} />);
    expect(screen.getByText('1 dia seguido')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('nunca usa vocabulário proibido no texto estático do componente', () => {
    const { container } = render(<MelhorSequencia melhorSequencia={5} totalCheckins={23} />);
    const textoCompleto = (container.textContent ?? '').toLowerCase();
    for (const termoProibido of VOCABULARIO_PROIBIDO) {
      expect(textoCompleto).not.toContain(termoProibido);
    }
  });
});
