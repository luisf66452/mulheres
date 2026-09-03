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

const PRECO_EBOOK = {
  currency: 'brl',
  unit_amount: 2700,
  currency_options: { brl: { unit_amount: 2700 }, eur: { unit_amount: 499 } },
};

const PRECO_MENSAL = {
  currency: 'brl',
  unit_amount: 3999,
  currency_options: { brl: { unit_amount: 3999 }, eur: { unit_amount: 999 } },
};

function criarStripeFake(opts: {
  createCheckoutSession?: () => unknown;
  retrievePrice?: (priceId: string) => unknown;
}) {
  return {
    checkout: {
      sessions: {
        create: vi.fn(opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao-ebook' }))),
      },
    },
    prices: {
      retrieve: vi.fn(async (priceId: string) => (opts.retrievePrice ? opts.retrievePrice(priceId) : PRECO_EBOOK)),
    },
  };
}

function criarRequisicao(corpo: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/stripe/checkout-ebook', {
    method: 'POST',
    body: JSON.stringify(corpo),
  });
}

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_EBOOK', 'price_ebook_teste');
  vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
});

describe('POST /api/stripe/checkout-ebook', () => {
  it('cria a Checkout Session em mode payment, sem customer, e retorna a url', async () => {
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());
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

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(503);
  });

  it('retorna 503 quando STRIPE_PRICE_ID_EBOOK não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_EBOOK', '');
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST(criarRequisicao());

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

    const resposta = await POST(criarRequisicao());
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

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(500);
    spyConsole.mockRestore();
  });

  it('cria a Checkout Session em mode subscription com ebook + assinatura mensal quando comBump é true', async () => {
    const stripeFake = criarStripeFake({
      retrievePrice: async (priceId: string) => (priceId === 'price_mensal_teste' ? PRECO_MENSAL : PRECO_EBOOK),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao({ comBump: true }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-ebook');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [
          { price: 'price_ebook_teste', quantity: 1 },
          { price: 'price_mensal_teste', quantity: 1 },
        ],
        currency: 'brl',
        metadata: { origem: 'ebook_bump' },
      })
    );
  });

  it('ignora o bump e cria checkout normal (só ebook) quando comBump é true mas STRIPE_PRICE_ID_MENSAL não está configurado', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', '');
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao({ comBump: true }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-ebook');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_ebook_teste', quantity: 1 }],
      })
    );
  });

  it('ignora o bump e cria checkout normal (só ebook) quando o Price da assinatura mensal não tem currency_options para a moeda esperada', async () => {
    const stripeFake = criarStripeFake({
      retrievePrice: async (priceId: string) =>
        priceId === 'price_mensal_teste'
          ? { currency: 'eur', unit_amount: 999, currency_options: { eur: { unit_amount: 999 } } }
          : PRECO_EBOOK,
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao({ comBump: true }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao-ebook');
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_ebook_teste', quantity: 1 }],
      })
    );
  });
});
