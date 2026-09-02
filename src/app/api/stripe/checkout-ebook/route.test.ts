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

function criarStripeFake(opts: {
  createCheckoutSession?: () => unknown;
  retrievePrice?: () => unknown;
}) {
  return {
    checkout: {
      sessions: {
        create: vi.fn(opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }))),
      },
    },
    prices: {
      retrieve: vi.fn(
        opts.retrievePrice ??
          (async () => ({
            currency: 'brl',
            unit_amount: 2700,
            currency_options: { brl: { unit_amount: 2700 }, eur: { unit_amount: 499 } },
          }))
      ),
    },
  };
}

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
});

describe('POST /api/stripe/checkout-ebook', () => {
  it('cria a Checkout Session em mode payment, sem customer, e retorna a url', async () => {
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-ebook');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_ebook_teste', quantity: 1 }],
        currency: 'brl',
        success_url: 'https://app.exemplo.com/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.exemplo.com/ebook',
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

  it('retorna 503 quando STRIPE_PRICE_ID_EBOOK não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST();

    expect(resposta.status).toBe(503);
  });

  it('recusa o checkout com mensagem segura quando o Price não tem currency_options para a moeda esperada, em vez de cobrar na moeda default do Price silenciosamente', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({
      // Price sem currency_options.brl — cenário de configuração incompleta no Stripe.
      retrievePrice: async () => ({
        currency: 'eur',
        unit_amount: 499,
        currency_options: { eur: { unit_amount: 499 } },
      }),
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
