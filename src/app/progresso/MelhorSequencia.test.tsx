import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MelhorSequencia from './MelhorSequencia';

describe('MelhorSequencia', () => {
  it('não renderiza nada quando não há sequência ainda', () => {
    const { container } = render(<MelhorSequencia melhorSequencia={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra rótulo, destaque e texto de apoio como um único cartão coeso', () => {
    render(<MelhorSequencia melhorSequencia={7} />);
    expect(screen.getByText('Sua melhor sequência')).toBeTruthy();
    expect(screen.getByText('7 dias seguidos')).toBeTruthy();
    expect(
      screen.getByText(/Este resumo mostra apenas o que você registrou/)
    ).toBeTruthy();
  });

  it('usa singular corretamente para uma sequência de 1 dia', () => {
    render(<MelhorSequencia melhorSequencia={1} />);
    expect(screen.getByText('1 dia seguido')).toBeTruthy();
  });
});
