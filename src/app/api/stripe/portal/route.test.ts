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

type PerfilFake = {
  plano: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id?: string | null;
  assinatura_status?: string | null;
  assinatura_periodo_fim?: string | null;
};

function criarPerfilConstrutor(perfil: PerfilFake | null) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    single: vi.fn(async () => ({ data: perfil, error: null })),
  };
  return construtor;
}

function criarSupabaseServerFake(opts: { user: { id: string } | null; perfil?: PerfilFake | null }) {
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

function criarAssinatura(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_recuperada',
    status: 'active',
    items: { data: [{ current_period_end: 1893456000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function criarStripeFake(opts: {
  retrieveCustomer?: (id: string) => unknown;
  searchCustomers?: () => unknown;
  listSubscriptions?: (params: unknown) => unknown;
  createPortalSession?: () => unknown;
}) {
  return {
    customers: {
      retrieve: vi.fn(opts.retrieveCustomer ?? (async () => ({ id: 'cus_qualquer', object: 'customer' }))),
      search: vi.fn(opts.searchCustomers ?? (async () => ({ data: [] }))),
    },
    subscriptions: {
      list: vi.fn(opts.listSubscriptions ?? (async () => ({ data: [] }))),
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
  it('abre o portal normalmente quando o Customer salvo é válido e tem assinatura ativa', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: 'cus_valido' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_valido', object: 'customer' }),
      listSubscriptions: async () => ({ data: [criarAssinatura({ status: 'active' })] }),
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

  it('premium + stripe_customer_id null: recupera Customer e assinatura ativa por metadata.usuaria_id', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const assinaturaAtiva = criarAssinatura({ status: 'active' });
    const stripeFake = criarStripeFake({
      searchCustomers: async () => ({ data: [{ id: 'cus_recuperado', object: 'customer' }] }),
      listSubscriptions: async () => ({ data: [assinaturaAtiva] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://billing.stripe.com/sessao');
    expect(stripeFake.customers.retrieve).not.toHaveBeenCalled();
    expect(stripeFake.customers.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.stringContaining(USUARIA_ID) })
    );
    expect(stripeFake.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_recuperado' })
    );
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_recuperado',
        stripe_subscription_id: 'sub_recuperada',
        assinatura_status: 'active',
        assinatura_periodo_fim: new Date(1893456000 * 1000).toISOString(),
        plano: 'premium',
      },
    ]);
  });

  it('premium + stripe_customer_id null + nenhuma assinatura encontrada: normaliza para free e retorna perfilAtualizado', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      searchCustomers: async () => ({ data: [] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(corpo.erro).toBeDefined();
    expect(corpo.perfilAtualizado).toBe(true);
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

  it('Customer existe mas não tem assinatura ativa: procura outro Customer com assinatura antes de desistir', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: 'cus_sem_assinatura' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const assinaturaAtiva = criarAssinatura({ status: 'active' });
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_sem_assinatura', object: 'customer' }),
      searchCustomers: async () => ({ data: [{ id: 'cus_com_assinatura', object: 'customer' }] }),
      listSubscriptions: async (params: unknown) => {
        const { customer } = params as { customer: string };
        if (customer === 'cus_com_assinatura') return { data: [assinaturaAtiva] };
        return { data: [] };
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://billing.stripe.com/sessao');
    expect(stripeFake.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_com_assinatura' })
    );
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_com_assinatura',
        stripe_subscription_id: 'sub_recuperada',
        assinatura_status: 'active',
        assinatura_periodo_fim: new Date(1893456000 * 1000).toISOString(),
        plano: 'premium',
      },
    ]);
  });

  it('Customer existe sem assinatura ativa e nenhum outro é encontrado: normaliza para free', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: 'cus_sem_assinatura' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => ({ id: 'cus_sem_assinatura', object: 'customer' }),
      searchCustomers: async () => ({ data: [] }),
      listSubscriptions: async () => ({ data: [] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(corpo.perfilAtualizado).toBe(true);
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

  it('recupera um Customer válido quando o id salvo pertence a uma conta Stripe antiga (resource_missing)', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: 'cus_antigo' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const assinaturaAtiva = criarAssinatura({ status: 'trialing' });
    const stripeFake = criarStripeFake({
      retrieveCustomer: async () => {
        throw new Stripe.errors.StripeInvalidRequestError({
          code: 'resource_missing',
          message: 'No such customer: cus_antigo',
        });
      },
      searchCustomers: async () => ({ data: [{ id: 'cus_recuperado', object: 'customer' }] }),
      listSubscriptions: async () => ({ data: [assinaturaAtiva] }),
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.url).toBe('https://billing.stripe.com/sessao');
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_recuperado',
        stripe_subscription_id: 'sub_recuperada',
        assinatura_status: 'trialing',
        assinatura_periodo_fim: new Date(1893456000 * 1000).toISOString(),
        plano: 'premium',
      },
    ]);
  });

  it('retorna 500 e não apaga dados quando a validação do Customer falha por erro temporário da Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: 'cus_valido' },
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

  it('retorna 500 e não apaga dados quando a busca por metadata falha por erro temporário da Stripe', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'premium', stripe_customer_id: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({
      searchCustomers: async () => {
        throw new Stripe.errors.StripeConnectionError({ message: 'timeout de rede' });
      },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();

    expect(resposta.status).toBe(500);
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
    spyConsole.mockRestore();
  });

  it('não normaliza nem consulta a Stripe quando a conta é free e nunca teve stripe_customer_id', async () => {
    const serverFake = criarSupabaseServerFake({
      user: { id: USUARIA_ID },
      perfil: { plano: 'free', stripe_customer_id: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const stripeFake = criarStripeFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);

    const resposta = await POST();

    expect(resposta.status).toBe(400);
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
    expect(stripeFake.customers.retrieve).not.toHaveBeenCalled();
    expect(stripeFake.customers.search).not.toHaveBeenCalled();
  });
});
