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
    window.location = { ...originalLocation, href: '' } as any;

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero o ebook/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/sessao-ebook');
    });

    window.location = originalLocation as any;
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'O ebook ainda não está disponível.' }),
    } as Response);

    render(<EbookClient precoExibicao="R$ 27,00" />);
    fireEvent.click(screen.getByRole('button', { name: /quero o ebook/i }));

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
    const botao = screen.getByRole('button', { name: /quero o ebook/i });
    fireEvent.click(botao);

    expect(botao).toBeDisabled();

    resolverFetch({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/x' }) });
  });
});
