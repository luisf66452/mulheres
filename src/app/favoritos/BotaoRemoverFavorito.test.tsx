// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Component, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BotaoRemoverFavorito from './BotaoRemoverFavorito';

const routerRefresh = vi.fn();

vi.mock('next/navigation', async () => {
  const real = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...real,
    useRouter: () => ({ refresh: routerRefresh }),
  };
});

vi.mock('./actions', () => ({
  desfavoritar: vi.fn(async () => {}),
}));

import { desfavoritar } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Fica no lugar do RedirectBoundary real do Next.js App Router: captura o
 * erro que `unstable_rethrow` deixa propagar e expõe o digest, para provar
 * que o erro de redirect chegou até "o framework" em vez de ser engolido e
 * tratado como falha genérica dentro do próprio BotaoRemoverFavorito.
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

describe('BotaoRemoverFavorito', () => {
  it('chama desfavoritar() e atualiza a rota ao remover com sucesso', async () => {
    render(<BotaoRemoverFavorito tipo="pratica" id="pratica-1" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(desfavoritar).toHaveBeenCalledWith('pratica', 'pratica-1'));
    await waitFor(() => expect(routerRefresh).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra a mensagem de erro se a action falhar de verdade (não um redirect)', async () => {
    vi.mocked(desfavoritar).mockRejectedValueOnce(new Error('falhou'));

    render(<BotaoRemoverFavorito tipo="pratica" id="pratica-1" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível remover.'));
  });

  it('não mostra erro genérico e deixa o erro de redirect do Next.js propagar para o framework', async () => {
    const digestDoRedirect = 'NEXT_REDIRECT;replace;/login;307;';
    const erroDeRedirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: digestDoRedirect });
    vi.mocked(desfavoritar).mockRejectedValueOnce(erroDeRedirect);

    // Silencia o log de erro que o React emite ao reportar o erro capturado
    // pelo error boundary — esperado e não é o que este teste verifica.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <LimiteDeErroDeTeste>
        <BotaoRemoverFavorito tipo="pratica" id="pratica-1" />
      </LimiteDeErroDeTeste>
    );
    fireEvent.click(screen.getByRole('button'));

    // O erro de redirect deve chegar ao "framework" (aqui, o error boundary
    // que faz esse papel) com o digest intacto — nunca ser engolido pelo
    // catch do BotaoRemoverFavorito e tratado como uma falha genérica que
    // mostra "Não foi possível remover.".
    await waitFor(() => expect(screen.getByTestId('erro-capturado')).toHaveTextContent(digestDoRedirect));
    expect(screen.queryByText('Não foi possível remover.')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
