import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import InstalarRose from './InstalarRose';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

vi.mock('@/lib/pwa/usePwaInstall', () => ({
  usePwaInstall: vi.fn(),
}));

const usePwaInstallMock = vi.mocked(usePwaInstall);

function mockar(sobrescreve: Partial<ReturnType<typeof usePwaInstall>>) {
  usePwaInstallMock.mockReturnValue({
    podeInstalar: false,
    ehIOS: false,
    ehStandalone: false,
    foiDispensado: false,
    instalar: vi.fn(),
    dispensar: vi.fn(),
    ...sobrescreve,
  });
}

describe('InstalarRose', () => {
  it('nao renderiza nada em modo standalone', () => {
    mockar({ ehStandalone: true, podeInstalar: true });
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('nao renderiza nada se foi dispensado', () => {
    mockar({ foiDispensado: true, podeInstalar: true });
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra botao de instalar quando o prompt esta disponivel (Android)', () => {
    mockar({ podeInstalar: true });
    render(<InstalarRose variante="banner" />);
    expect(screen.getByRole('button', { name: /instalar rose/i })).toBeInTheDocument();
  });

  it('mostra instrucoes de iOS quando ehIOS e nao esta standalone', () => {
    mockar({ ehIOS: true });
    render(<InstalarRose variante="banner" />);
    expect(screen.getByText(/toque no botão compartilhar/i)).toBeInTheDocument();
    expect(screen.getByText(/adicionar à tela de início/i)).toBeInTheDocument();
  });

  it('nao renderiza nada quando nao ha prompt disponivel e nao e iOS', () => {
    mockar({});
    const { container } = render(<InstalarRose variante="banner" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('variante compacto nao mostra botao de dispensar', () => {
    mockar({ podeInstalar: true });
    render(<InstalarRose variante="compacto" />);
    expect(screen.queryByRole('button', { name: /dispensar/i })).not.toBeInTheDocument();
  });

  it('variante banner mostra botao de dispensar que chama dispensar()', () => {
    const dispensar = vi.fn();
    mockar({ podeInstalar: true, dispensar });
    render(<InstalarRose variante="banner" />);
    screen.getByRole('button', { name: /dispensar aviso de instalação/i }).click();
    expect(dispensar).toHaveBeenCalledOnce();
  });
});
