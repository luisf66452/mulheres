// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EbookClient from './EbookClient';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockReset();
  global.fetch = vi.fn();
});

describe('EbookClient', () => {
  it('redireciona para a url de checkout quando a API retorna sucesso', async () => {
    const originalLocation = window.location;
    // @ts-expect-error -- substituição controlada só para este teste, restaurada no final
    delete window.location;
    window.location = { ...originalLocation, href: '' } as unknown as (string & Location);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero começar hoje/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/sessao-ebook');
    });

    window.location = originalLocation as unknown as (string & Location);
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'O ebook ainda não está disponível.' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero começar hoje/i }));

    expect(await screen.findByText('O ebook ainda não está disponível.')).toBeInTheDocument();
  });

  it('desabilita o botão enquanto a compra está em andamento', async () => {
    let resolverFetch: (value: unknown) => void = () => {};
    vi.mocked(global.fetch).mockReturnValue(
      new Promise((resolve) => {
        resolverFetch = resolve;
      }) as never
    );

    render(<EbookClient precoExibicao="R$ 27,00" />);
    const botao = screen.getByRole('button', { name: /quero começar hoje/i });
    fireEvent.click(botao);

    expect(botao).toBeDisabled();

    resolverFetch({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/x' }) });
  });

  it('não mostra o checkbox do order bump quando mostrarBump não é passado', () => {
    render(<EbookClient precoExibicao="R$ 27,00" />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('envia comBump: false quando mostrarBump é true mas o checkbox não é marcado', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" mostrarBump precoBumpExibicao="R$ 39,99" />);
    fireEvent.click(screen.getByRole('button', { name: /quero começar hoje/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/checkout-ebook',
        expect.objectContaining({ body: JSON.stringify({ comBump: false }) })
      );
    });
  });

  it('envia comBump: true quando o checkbox do order bump está marcado', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" mostrarBump precoBumpExibicao="R$ 39,99" />);
    fireEvent.click(screen.getByRole('checkbox', { name: /rose pro/i }));
    fireEvent.click(screen.getByRole('button', { name: /quero começar hoje/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/checkout-ebook',
        expect.objectContaining({ body: JSON.stringify({ comBump: true }) })
      );
    });
  });
});
