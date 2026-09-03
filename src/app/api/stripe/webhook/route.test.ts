// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { obterStripe } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

type ErroSimulado = { code?: string; message: string } | null;

function criarAdminClienteFake(opts: {
  erroIdempotencia?: ErroSimulado;
  erroUpdatePerfil?: ErroSimulado;
  linhasAtualizadas?: Array<{ id: string }> | null;
}) {
  const chamadasUpdate: unknown[] = [];

  return {
    from: vi.fn((tabela: string) => {
      if (tabela === 'stripe_eventos_processados') {
        return {
          insert: vi.fn(async () => ({ error: opts.erroIdempotencia ?? null })),
        };
      }

      if (tabela === 'perfis') {
        return {
          update: vi.fn((payload: unknown) => {
            chamadasUpdate.push(payload);
            return {
              eq: vi.fn(() => ({
                select: vi.fn(async () => ({
                  data: opts.linhasAtualizadas ?? [{ id: 'user-1' }],
                  error: opts.erroUpdatePerfil ?? null,
                })),
              })),
            };
          }),
        };
      }

      throw new Error(`tabela inesperada em teste: ${tabela}`);
    }),
    __chamadasUpdate: chamadasUpdate,
  };
}

function criarStripeFake(evento: unknown) {
  return {
    webhooks: {
      constructEvent: vi.fn(() => evento),
    },
  };
}

function criarRequisicao() {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'assinatura-de-teste' },
    body: JSON.stringify({}),
  });
}

const EVENTO_CHECKOUT_COMPLETO = {
  id: 'evt_checkout_1',
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: { usuaria_id: 'user-1' },
      client_reference_id: null,
      customer: 'cus_1',
      subscription: 'sub_1',
      payment_status: 'paid',
    },
  },
};

const EVENTO_CHECKOUT_COMPLETO_PAGAMENTO_PENDENTE = {
  id: 'evt_checkout_2',
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: { usuaria_id: 'user-1' },
      client_reference_id: null,
      customer: 'cus_1',
      subscription: 'sub_1',
      payment_status: 'unpaid',
    },
  },
};

// Compra avulsa sem conta vinculada — ex.: order bump da assinatura no
// checkout do ebook (/api/stripe/checkout-ebook), que não exige login.
const EVENTO_CHECKOUT_COMPLETO_SEM_USUARIA = {
  id: 'evt_checkout_3',
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: { origem: 'ebook_bump' },
      client_reference_id: null,
      customer: 'cus_guest',
      subscription: 'sub_guest',
      payment_status: 'paid',
    },
  },
};

const EVENTO_SUBSCRIPTION_UPDATED_COM_USUARIA = {
  id: 'evt_sub_1',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      metadata: { usuaria_id: 'user-1' },
      items: { data: [{ current_period_end: 1893456000 }] },
    },
  },
};

// Assinatura do bump guest (sem usuaria_id) — customer não corresponde a
// nenhum perfil porque nunca houve conta criada pra essa compra.
const EVENTO_SUBSCRIPTION_UPDATED_SEM_USUARIA = {
  id: 'evt_sub_2',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_guest',
      customer: 'cus_guest',
      status: 'active',
      metadata: {},
      items: { data: [{ current_period_end: 1893456000 }] },
    },
  },
};

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'segredo-de-teste');
  });

  it('reprocessa um evento duplicado em vez de ignorá-lo', async () => {
    const stripeFake = criarStripeFake(EVENTO_CHECKOUT_COMPLETO);
    const adminFake = criarAdminClienteFake({
      erroIdempotencia: { code: '23505', message: 'duplicate key' },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toEqual({ recebido: true, duplicado: true });
    // Mesmo duplicado, o handler idempotente do perfil roda de novo.
    expect(adminFake.__chamadasUpdate).toHaveLength(1);
  });

  it('retorna 500 quando o update do perfil falha', async () => {
    const stripeFake = criarStripeFake(EVENTO_CHECKOUT_COMPLETO);
    const adminFake = criarAdminClienteFake({
      erroUpdatePerfil: { message: 'erro simulado de update' },
    });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(500);
    expect(corpo).toEqual({ erro: 'Erro ao processar evento.' });
  });

  it('atualiza o perfil corretamente em checkout.session.completed', async () => {
    const stripeFake = criarStripeFake(EVENTO_CHECKOUT_COMPLETO);
    const adminFake = criarAdminClienteFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toEqual({ recebido: true, duplicado: false });
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
        plano: 'premium',
        assinatura_status: 'active',
      },
    ]);
  });

  it('não promove a premium em checkout.session.completed quando o pagamento ainda não foi confirmado (ex.: boleto pendente)', async () => {
    const stripeFake = criarStripeFake(EVENTO_CHECKOUT_COMPLETO_PAGAMENTO_PENDENTE);
    const adminFake = criarAdminClienteFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(200);
    expect(adminFake.__chamadasUpdate).toEqual([
      {
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
      },
    ]);
  });

  it('não lança erro em checkout.session.completed sem usuária vinculada (compra avulsa, ex.: bump do ebook)', async () => {
    const stripeFake = criarStripeFake(EVENTO_CHECKOUT_COMPLETO_SEM_USUARIA);
    const adminFake = criarAdminClienteFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toEqual({ recebido: true, duplicado: false });
    expect(adminFake.__chamadasUpdate).toHaveLength(0);
  });

  it('atualiza o perfil em customer.subscription.updated quando encontra a usuária pelo customer', async () => {
    const stripeFake = criarStripeFake(EVENTO_SUBSCRIPTION_UPDATED_COM_USUARIA);
    const adminFake = criarAdminClienteFake({});
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(200);
    expect(adminFake.__chamadasUpdate).toHaveLength(1);
  });

  it('retorna 500 quando customer.subscription.updated de uma assinatura COM usuária vinculada não encontra o perfil (falha real)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake(EVENTO_SUBSCRIPTION_UPDATED_COM_USUARIA);
    const adminFake = criarAdminClienteFake({ linhasAtualizadas: [] });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());

    expect(resposta.status).toBe(500);
    spyConsole.mockRestore();
  });

  it('não lança erro quando customer.subscription.updated de uma assinatura SEM usuária vinculada não encontra perfil (assinante guest, ex.: bump do ebook)', async () => {
    const stripeFake = criarStripeFake(EVENTO_SUBSCRIPTION_UPDATED_SEM_USUARIA);
    const adminFake = criarAdminClienteFake({ linhasAtualizadas: [] });
    vi.mocked(obterStripe).mockReturnValue(stripeFake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST(criarRequisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toEqual({ recebido: true, duplicado: false });
  });
});
