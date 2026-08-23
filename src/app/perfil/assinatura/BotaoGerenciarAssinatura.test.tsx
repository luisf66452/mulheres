import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BotaoGerenciarAssinatura from './BotaoGerenciarAssinatura';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const originalLocation = window.location;

beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
});

describe('BotaoGerenciarAssinatura', () => {
  it('redireciona para o Billing Portal quando a API retorna uma url', async () => {
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/sessao' }),
    } as Response);

    render(<BotaoGerenciarAssinatura />);
    fireEvent.click(screen.getByRole('button', { name: /gerenciar ou cancelar assinatura/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('https://billing.stripe.com/sessao');
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('chama router.refresh() quando a API indica que o perfil foi normalizado (perfilAtualizado)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        erro: 'Não encontramos uma assinatura ativa. Assine novamente para ter acesso ao Rose Pro.',
        perfilAtualizado: true,
      }),
    } as Response);

    render(<BotaoGerenciarAssinatura />);
    fireEvent.click(screen.getByRole('button', { name: /gerenciar ou cancelar assinatura/i }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText(/não encontramos uma assinatura ativa/i)
    ).toBeInTheDocument();
  });

  it('não chama router.refresh() em um erro comum (sem perfilAtualizado)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ erro: 'Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente.' }),
    } as Response);

    render(<BotaoGerenciarAssinatura />);
    fireEvent.click(screen.getByRole('button', { name: /gerenciar ou cancelar assinatura/i }));

    await screen.findByText(/não foi possível abrir/i);
    expect(refresh).not.toHaveBeenCalled();
  });
});
