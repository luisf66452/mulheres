import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import FormaRespiracaoOrganica from './FormaRespiracaoOrganica';
import HaloMeditacao from './HaloMeditacao';
import RamoDiario from './RamoDiario';
import PetalasAutocompaixao from './PetalasAutocompaixao';

describe('ilustrações das práticas rápidas', () => {
  it('FormaRespiracaoOrganica renderiza em expansão e em recolhimento sem erro', () => {
    const expandida = render(<FormaRespiracaoOrganica emExpansao duracaoSegundos={4} />);
    expect(expandida.container.querySelector('svg')).toBeTruthy();
    const recolhida = render(<FormaRespiracaoOrganica emExpansao={false} duracaoSegundos={6} />);
    expect(recolhida.container.querySelector('svg')).toBeTruthy();
  });

  it('HaloMeditacao renderiza nos dois tamanhos sem erro', () => {
    const pequena = render(<HaloMeditacao tamanho="pequena" />);
    expect(pequena.container.querySelector('svg')).toBeTruthy(); // RosaBotanica interna
    const media = render(<HaloMeditacao tamanho="media" />);
    expect(media.container.querySelector('svg')).toBeTruthy();
  });

  it('RamoDiario renderiza sem erro', () => {
    const { container } = render(<RamoDiario />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('PetalasAutocompaixao renderiza duas pétalas sem erro', () => {
    const { container } = render(<PetalasAutocompaixao />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });

  it('todas as ilustrações desta pasta são aria-hidden (puramente decorativas)', () => {
    for (const Componente of [FormaRespiracaoOrganica, HaloMeditacao, RamoDiario, PetalasAutocompaixao]) {
      const { container } = render(<Componente emExpansao duracaoSegundos={1} />);
      const raiz = container.firstElementChild;
      expect(raiz?.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
