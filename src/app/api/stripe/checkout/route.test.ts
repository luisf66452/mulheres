// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { POST } from './route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/site-url', () => ({
  obterUrlBaseDoRequest: vi.fn(async () => 'https://app.exemplo.com'),
}));

const USUARIA_ID = 'usuaria-1';

function criarRequisicao(corpo: unknown = { plano: 'mensal' }) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
}

function criarPerfilConstrutor(perfil: { stripe_customer_id: string | null; plano: string } | null) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    single: vi.fn(async () => ({ data: perfil, error: null })),
  };
  return construtor;
}

function criarSupabaseServerFake(opts: {
  user: { id: string; email?: string } | null;
  perfil?: { stripe_customer_id: string | null; plano: string } | null;
}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: opts.user } })),
    },
    from: vi.fn((tabela: string) => {
      if (tabela === 'perfis') return criarPerfilConstrutor(opts.perfil ?? null);
      throw new Error(`tabela inesperada em teste: ${tabela}`);
    }),
  };
}

function criarSupabaseAdminFake() {
  const chamadasUpdate: unknown[] = [];
  const update = vi.fn((payload: unknown) => {
    chamadasUpdate.push(payload);
    return { eq: vi.fn(async () => ({ error: null })) };
  });

  return {
    from: vi.fn((tabela: string) => {
      if (tabela === 'perfis') return { update };
      throw new Error(`tabela inesperada em teste: ${tabela}`);
    }),
    __chamadasUpdate: chamadasUpdate,
  };
}

function criarStripeFake(opts: {
  retrieveCustomer?: (id: string) => unknown;
  createCustomer?: () => unknown;
  createCheckoutSession?: () => unknown;
}) {
  return {
    customers: {
      retrieve: vi.fn(opts.retrieveCustomer ?? (async () => ({ id: 'cus_qualquer', object: 'customer' }))),
      create: vi.fn(opts.createCustomer ?? (async () => ({ id: 'cus_novo' }))),
    },
    checkout: {
      sessions: {
        create: vi.fn(opts.createCheckoutSession ?? (async () => ({ url: 'https://checkout.stripe.com/sessao' }))),
      },
    },
    prices: {
      retrieve: vi.fn(async () => ({ unit_amount: 1990, currency: 'brl' })),
    },
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(obterStripe).mockReset();
  vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
  vi.stubEnv('STRIPE_PRICE_ID_ANUAL', 'price_anual_teste');
});

describe('POST /api/stripe/checkout', () => {
  it('reutiliza o Customer existente quando ele ainda é válido na conta Stripe atual', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID, email: 'usuaria@exemplo.com' },
      perfil: { stripe_customer_id: 'cus_valido', plano: 'free' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_valido', object: 'customer' }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao');
    expect(stripeFake.customers.create).not.toHaveBeenCalled();
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_valido' })
    );
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
  });

  it('cria um novo Customer quando o id salvo pertence a uma conta Stripe antiga (resource_missing)', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID, email: 'usuaria@exemplo.com' },
      perfil: { stripe_customer_id: 'cus_antigo', plano: 'free' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => {
        throw new Stripe.errors.StripeInvalidRequestError({
          code: 'resource_missing',
          message: 'No such customer: cus_antigo',
        });
      },
      createCustomer: async () => ({ id: 'cus_novo' }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://checkout.stripe.com/sessao');
    expect(stripeFake.customers.create).toHaveBeenCalledWith({
      email: 'usuaria@exemplo.com',
      metadata: { usuaria_id: USUARIA_ID },
    });
    expect(stripeFake.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_novo' })
    );
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_novo',
        stripe_subscription_id: null,
        assinatura_status: null,
        assinatura_periodo_fim: null,
      },
    ]);
  });

  it('cria um novo Customer quando o id salvo aponta para um Customer deletado', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID, email: 'usuaria@exemplo.com' },
      perfil: { stripe_customer_id: 'cus_deletado', plano: 'free' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_deletado', object: 'customer', deleted: true }),
      createCustomer: async () => ({ id: 'cus_novo' }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(200);
    expect(stripeFake.customers.create).toHaveBeenCalled();
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_novo',
        stripe_subscription_id: null,
        assinatura_status: null,
        assinatura_periodo_fim: null,
      },
    ]);
  });

  it('retorna 500 e não apaga dados quando a validação do Customer falha por erro temporário da Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID, email: 'usuaria@exemplo.com' },
      perfil: { stripe_customer_id: 'cus_valido', plano: 'free' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => {
        throw new Stripe.errors.StripeConnectionError({ message: 'timeout de rede' });
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(500);
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
    spyConsole.mockRestore();
  });

  it('cria um Customer novo normalmente quando a usuária ainda não tem stripe_customer_id', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID, email: 'usuaria@exemplo.com' },
      perfil: { stripe_customer_id: null, plano: 'free' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({ createCustomer: async () => ({ id: 'cus_novo' }) });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(200);
    expect(stripeFake.customers.retrieve).not.toHaveBeenCalled();
    expect(stripeFake.customers.create).toHaveBeenCalled();
  });
});
