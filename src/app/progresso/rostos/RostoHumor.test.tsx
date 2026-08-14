import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import RostoHumor from './RostoHumor';

describe('RostoHumor', () => {
  it('renderiza um svg decorativo (aria-hidden) para cada nível de humor', () => {
    ([1, 2, 3, 4, 5] as const).forEach((nivel) => {
      const { container, unmount } = render(<RostoHumor nivel={nivel} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      unmount();
    });
  });

  it('usa a cor do token de humor correspondente ao nível', () => {
    const { container } = render(<RostoHumor nivel={5} />);
    const circulo = container.querySelector('circle');
    expect(circulo?.getAttribute('fill')).toBe('var(--color-humor-5)');
  });
});
