// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { obterAssinaturaAtivaDoCustomer, encontrarAssinaturaAtivaPorUsuaria } from './assinatura';

function criarAssinatura(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_1',
    status: 'active',
    items: { data: [{ current_period_end: 1893456000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function criarStripeFake(opts: {
  listSubscriptions?: (params: unknown) => unknown;
  searchCustomers?: () => unknown;
}) {
  return {
    subscriptions: {
      list: vi.fn(opts.listSubscriptions ?? (async () => ({ data: [] }))),
    },
    customers: {
      search: vi.fn(opts.searchCustomers ?? (async () => ({ data: [] }))),
    },
  } as unknown as Stripe;
}

describe('obterAssinaturaAtivaDoCustomer', () => {
  it('retorna a assinatura quando o customer tem uma assinatura active', async () => {
    const assinaturaAtiva = criarAssinatura({ status: 'active' });
    const stripe = criarStripeFake({ listSubscriptions: async () => ({ data: [assinaturaAtiva] }) });

    const resultado = await obterAssinaturaAtivaDoCustomer(stripe, 'cus_1');

    expect(resultado).toEqual(assinaturaAtiva);
  });

  it('retorna a assinatura quando o customer tem uma assinatura trialing', async () => {
    const assinaturaTrial = criarAssinatura({ status: 'trialing' });
    const stripe = criarStripeFake({ listSubscriptions: async () => ({ data: [assinaturaTrial] }) });

    const resultado = await obterAssinaturaAtivaDoCustomer(stripe, 'cus_1');

    expect(resultado).toEqual(assinaturaTrial);
  });

  it('retorna null quando o customer só tem assinaturas canceladas', async () => {
    const assinaturaCancelada = criarAssinatura({ status: 'canceled' });
    const stripe = criarStripeFake({ listSubscriptions: async () => ({ data: [assinaturaCancelada] }) });

    const resultado = await obterAssinaturaAtivaDoCustomer(stripe, 'cus_1');

    expect(resultado).toBeNull();
  });

  it('retorna null quando o customer não tem nenhuma assinatura', async () => {
    const stripe = criarStripeFake({ listSubscriptions: async () => ({ data: [] }) });

    const resultado = await obterAssinaturaAtivaDoCustomer(stripe, 'cus_1');

    expect(resultado).toBeNull();
  });
});

describe('encontrarAssinaturaAtivaPorUsuaria', () => {
  it('retorna o customer e a assinatura quando encontra um customer com assinatura ativa', async () => {
    const customerFake = { id: 'cus_recuperado', object: 'customer' as const };
    const assinaturaAtiva = criarAssinatura({ status: 'active' });
    const stripe = criarStripeFake({
      searchCustomers: async () => ({ data: [customerFake] }),
      listSubscriptions: async () => ({ data: [assinaturaAtiva] }),
    });

    const resultado = await encontrarAssinaturaAtivaPorUsuaria(stripe, 'usuaria-1');

    expect(resultado).toEqual({ customer: customerFake, subscription: assinaturaAtiva });
    expect(vi.mocked(stripe.customers.search)).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.stringContaining('usuaria-1') })
    );
  });

  it('pula customers sem assinatura ativa e usa o próximo que tiver', async () => {
    const customerSemAssinatura = { id: 'cus_sem_assinatura', object: 'customer' as const };
    const customerComAssinatura = { id: 'cus_com_assinatura', object: 'customer' as const };
    const assinaturaAtiva = criarAssinatura({ status: 'active' });

    const stripe = criarStripeFake({
      searchCustomers: async () => ({ data: [customerSemAssinatura, customerComAssinatura] }),
      listSubscriptions: async (params: unknown) => {
        const { customer } = params as { customer: string };
        if (customer === 'cus_com_assinatura') return { data: [assinaturaAtiva] };
        return { data: [] };
      },
    });

    const resultado = await encontrarAssinaturaAtivaPorUsuaria(stripe, 'usuaria-1');

    expect(resultado).toEqual({ customer: customerComAssinatura, subscription: assinaturaAtiva });
  });

  it('retorna null quando nenhum customer encontrado tem assinatura ativa', async () => {
    const stripe = criarStripeFake({
      searchCustomers: async () => ({ data: [{ id: 'cus_1', object: 'customer' as const }] }),
      listSubscriptions: async () => ({ data: [] }),
    });

    const resultado = await encontrarAssinaturaAtivaPorUsuaria(stripe, 'usuaria-1');

    expect(resultado).toBeNull();
  });

  it('retorna null quando a busca não encontra nenhum customer', async () => {
    const stripe = criarStripeFake({ searchCustomers: async () => ({ data: [] }) });

    const resultado = await encontrarAssinaturaAtivaPorUsuaria(stripe, 'usuaria-1');

    expect(resultado).toBeNull();
  });
});
