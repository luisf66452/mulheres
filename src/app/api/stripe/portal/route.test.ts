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

function criarPerfilConstrutor(perfil: { stripe_customer_id: string | null } | null) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    single: vi.fn(async () => ({ data: perfil, error: null })),
  };
  return construtor;
}

function criarSupabaseServerFake(opts: {
  user: { id: string } | null;
  perfil?: { stripe_customer_id: string | null } | null;
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
  searchCustomers?: () => unknown;
  createPortalSession?: () => unknown;
}) {
  return {
    customers: {
      retrieve: vi.fn(opts.retrieveCustomer ?? (async () => ({ id: 'cus_qualquer', object: 'customer' }))),
      search: vi.fn(opts.searchCustomers ?? (async () => ({ data: [] }))),
    },
    billingPortal: {
      sessions: {
        create: vi.fn(opts.createPortalSession ?? (async () => ({ url: 'https://billing.stripe.com/sessao' }))),
      },
    },
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(obterStripe).mockReset();
});

describe('POST /api/stripe/portal', () => {
  it('abre o portal normalmente quando o Customer salvo ainda é válido', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { stripe_customer_id: 'cus_valido' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_valido', object: 'customer' }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://billing.stripe.com/sessao');
    expect(stripeFake.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_valido' })
    );
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
  });

  it('recupera um Customer da conta atual pelo metadata.usuaria_id quando o id salvo está obsoleto', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { stripe_customer_id: 'cus_antigo' },
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
      searchCustomers: async () => ({ data: [{ id: 'cus_recuperado', object: 'customer' }] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://billing.stripe.com/sessao');
    expect(stripeFake.customers.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.stringContaining(USUARIA_ID) })
    );
    expect(stripeFake.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_recuperado' })
    );
    expect(adminFake.__chamadasUpdate).toEqual([{ stripe_customer_id: 'cus_recuperado' }]);
  });

  it('normaliza o perfil para free e orienta a assinar de novo quando nenhum Customer é encontrado', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { stripe_customer_id: 'cus_antigo' },
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
      searchCustomers: async () => ({ data: [] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(corpo.erro).toBeDefined();
    expect(stripeFake.billingPortal.sessions.create).not.toHaveBeenCalled();
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        plano: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        assinatura_status: null,
        assinatura_periodo_fim: null,
      },
    ]);
  });

  it('retorna 500 e não apaga dados quando a validação do Customer falha por erro temporário da Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { stripe_customer_id: 'cus_valido' },
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

    const resposta = await POST();

    expect(resposta.status).toBe(500);
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
    spyConsole.mockRestore();
  });

  it('continua retornando 400 quando a usuária nunca teve stripe_customer_id', async () => {
    const serverFake = criarSupabaseServerFake({ user: { id: USUARIA_ID }, perfil: { stripe_customer_id: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake({}) as never);

    const resposta = await POST();

    expect(resposta.status).toBe(400);
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
  });
});
