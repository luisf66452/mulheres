// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OfertaRosePro from './OfertaRosePro';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('OfertaRosePro', () => {
  beforeEach(() => {
    replace.mockClear();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('apresenta a oferta como diálogo acessível e bloqueia o scroll de fundo', () => {
    render(<OfertaRosePro />);

    const titulo = screen.getByRole('heading', { name: /experiência completa da rose/i });
    expect(screen.getByRole('dialog', { name: /experiência completa da rose/i })).toBeInTheDocument();
    expect(screen.getByText(/todas as jornadas guiadas/i)).toBeInTheDocument();
    expect(screen.getByText(/biblioteca completa de práticas/i)).toBeInTheDocument();
    expect(titulo).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('leva para a escolha de planos sem deixar a oferta no histórico', () => {
    render(<OfertaRosePro />);

    fireEvent.click(screen.getByRole('button', { name: /ver planos do rose pro/i }));

    expect(replace).toHaveBeenCalledWith('/perfil/assinatura');
  });

  it('permite continuar gratuitamente e remove o marcador de entrada da URL', () => {
    render(<OfertaRosePro />);

    fireEvent.click(screen.getByRole('button', { name: /continuar gratuitamente/i }));

    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('permite fechar pelo teclado', () => {
    render(<OfertaRosePro />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
  });
});
