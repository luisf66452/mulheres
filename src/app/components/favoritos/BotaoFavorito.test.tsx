// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Component, type ReactNode } from 'react';
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

/**
 * Fica no lugar do RedirectBoundary real do Next.js App Router: captura o
 * erro que `unstable_rethrow` deixa propagar e expõe o digest, para provar
 * que o erro de redirect chegou até "o framework" em vez de ser engolido e
 * tratado como falha genérica dentro do próprio BotaoFavorito.
 */
class LimiteDeErroDeTeste extends Component<{ children: ReactNode }, { digest: string | null }> {
  state: { digest: string | null } = { digest: null };

  static getDerivedStateFromError(error: unknown) {
    const digest = error && typeof error === 'object' && 'digest' in error ? String(error.digest) : 'erro-sem-digest';
    return { digest };
  }

  render() {
    if (this.state.digest) {
      return <div data-testid="erro-capturado">{this.state.digest}</div>;
    }
    return this.props.children;
  }
}

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

  it('reverte o estado visual se a action falhar (prova o ciclo otimista-depois-revertido)', async () => {
    let rejeitar!: (erro: Error) => void;
    vi.mocked(favoritar).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejeitar = reject;
      })
    );

    render(<BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />);
    fireEvent.click(screen.getByRole('button'));

    // Update otimista já aplicado, antes da action resolver/rejeitar.
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');

    rejeitar(new Error('falhou'));

    // Só depois da rejeição a UI deve reverter.
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false'));
  });

  it('não reverte a UI otimista e deixa o erro de redirect do Next.js propagar para o framework', async () => {
    const digestDoRedirect = 'NEXT_REDIRECT;replace;/login;307;';
    const erroDeRedirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: digestDoRedirect });
    vi.mocked(favoritar).mockRejectedValueOnce(erroDeRedirect);

    // Silencia o log de erro que o React emite ao reportar o erro capturado
    // pelo error boundary — esperado e não é o que este teste verifica.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <LimiteDeErroDeTeste>
        <BotaoFavorito tipo="pratica" id="pratica-1" favoritadoInicial={false} />
      </LimiteDeErroDeTeste>
    );
    fireEvent.click(screen.getByRole('button'));

    // Update otimista aplicado antes da action rejeitar.
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');

    // O erro de redirect deve chegar ao "framework" (aqui, o error boundary
    // que faz esse papel) com o digest intacto — nunca ser engolido pelo
    // catch do BotaoFavorito e tratado como uma falha genérica que reverte a
    // UI otimista.
    await waitFor(() => expect(screen.getByTestId('erro-capturado')).toHaveTextContent(digestDoRedirect));

    consoleErrorSpy.mockRestore();
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
