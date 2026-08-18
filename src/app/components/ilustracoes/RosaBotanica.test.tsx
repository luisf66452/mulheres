import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import RosaBotanica, { type TamanhoRosaBotanica } from './RosaBotanica';

const TAMANHOS: TamanhoRosaBotanica[] = ['botao', 'pequena', 'media', 'florAberta'];

describe('RosaBotanica', () => {
  it.each(TAMANHOS)('renderiza sem erro no tamanho %s', (tamanho) => {
    const { container } = render(<RosaBotanica tamanho={tamanho} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renderiza sem caule/folhas quando comCaule=false', () => {
    const { container } = render(<RosaBotanica comCaule={false} />);
    // Sem caule, o <path> do caule (stroke salvia, sem fill de pétala) não deve existir.
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('é sempre aria-hidden (puramente decorativa)', () => {
    const { container } = render(<RosaBotanica />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('aceita a variante animada sem lançar erro', () => {
    const { container } = render(<RosaBotanica animada />);
    expect(container.querySelector('svg.rosa-botanica-entrada')).toBeTruthy();
  });
});
