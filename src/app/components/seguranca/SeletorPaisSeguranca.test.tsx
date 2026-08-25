import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeletorPaisSeguranca from './SeletorPaisSeguranca';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockClear();
});

describe('SeletorPaisSeguranca', () => {
  it('mostra um botão para cada país suportado', () => {
    render(<SeletorPaisSeguranca />);
    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Brasil' })).toBeTruthy();
  });

  it('ao escolher Portugal, navega para /seguranca?pais=PT', () => {
    render(<SeletorPaisSeguranca />);
    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    expect(replace).toHaveBeenCalledWith('/seguranca?pais=PT');
  });

  it('ao escolher Brasil, navega para /seguranca?pais=BR', () => {
    render(<SeletorPaisSeguranca />);
    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    expect(replace).toHaveBeenCalledWith('/seguranca?pais=BR');
  });

  it('marca o botão escolhido com aria-pressed', () => {
    render(<SeletorPaisSeguranca />);
    const botaoPT = screen.getByRole('button', { name: 'Portugal' }) as HTMLButtonElement;
    expect(botaoPT.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(botaoPT);
    expect(botaoPT.getAttribute('aria-pressed')).toBe('true');
  });
});
