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
});
