// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BotaoFavorito from './BotaoFavorito';

vi.mock('@/app/favoritos/actions', () => ({
  favoritar: vi.fn(async () => {}),
  desfavoritar: vi.fn(async () => {}),
}));

import { favoritar, desfavoritar } from '@/app/favoritos/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BotaoFavorito', () => {
  it('começa com aria-pressed=false quando favoritadoInicial é false', () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('começa com aria-pressed=true quando favoritadoInicial é true', () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('ao clicar em um botão não favoritado, chama favoritar() e atualiza aria-pressed', async () => {
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(favoritar).toHaveBeenCalledWith('pratica', 'pratica-1'));
    expect(desfavoritar).not.toHaveBeenCalled();
  });

  it('ao clicar em um botão já favoritado, chama desfavoritar() e atualiza aria-pressed', async () => {
    render(<BotaoFavorito tipo="sessao" id="sessao-1" favoritadoInicial={true} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(desfavoritar).toHaveBeenCalledWith('sessao', 'sessao-1'));
  });

  it('reverte o estado visual se a action falhar', async () => {
    vi.mocked(favoritar).mockRejectedValueOnce(new Error('falhou'));
    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false'));
  });

  it('não deixa o clique borbulhar para um Link/ancestral clicável', () => {
    const cliqueDoAncestral = vi.fn();
    render(
      <div onClick={cliqueDoAncestral}>
        <BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />
      </div>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(cliqueDoAncestral).not.toHaveBeenCalled();
  });
});
