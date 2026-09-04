// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { obterStripe } from '@/lib/stripe/client';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/site-url', () => ({
  obterUrlBaseDoRequest: vi.fn(async () => 'https://app.exemplo.com'),
}));

const PRECO_MENSAL = {
  currency: 'brl',
  unit_amount: 3999,
  currency_options: { brl: { unit_amount: 3999 }, eur: { unit_amount: 999 } },
};

function criarStripeFake(opts: {
  createCheckoutSession?: () => unknown;
  retrievePrice?: () => unknown;
}) {
  return {
    checkout: {
      sessions: {
        create: vi.fn(
          opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao-assinatura' }))
        ),
      },
    },
    prices: {
      retrieve: vi.fn(async () => (opts.retrievePrice ? opts.retrievePrice() : PRECO_MENSAL)),
    },
  };
}

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
});

describe('POST /api/stripe/checkout-assinatura', () => {
  it('cria a Checkout Session em mode subscription, sem customer, e retorna a url', async () => {
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-assinatura');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_mensal_teste', quantity: 1 }],
        currency: 'brl',
        success_url: 'https://app.exemplo.com/assinatura/obrigado?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.exemplo.com/assinatura',
        metadata: { origem: 'assinatura_landing' },
      })
    );
    expect(stripeFake.checkout.sessions.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ customer: expect.anything() })
    );
  });

  it('retorna 503 quando Stripe não está configurado', async () => {
    vi.mocked(obterStripe).mockReturnValue(null);

    const resposta = await POST();

    expect(resposta.status).toBe(503);
  });

  it('retorna 503 quando STRIPE_PRICE_ID_MENSAL não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', '');
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST();

    expect(resposta.status).toBe(503);
  });

  it('recusa o checkout quando o Price não tem currency_options para a moeda esperada', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      retrievePrice: () => ({ currency: 'eur', unit_amount: 999, currency_options: { eur: { unit_amount: 999 } } }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(503);
    expect(corpo.erro).toBeTruthy();
    expect(stripeFake.checkout.sessions.create).not.toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('retorna 500 quando a criação da sessão falha no Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      createCheckoutSession: async () => {
        throw new Error('falha de rede');
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();

    expect(resposta.status).toBe(500);
    spyConsole.mockRestore();
  });
});
