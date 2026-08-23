// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import Stripe from 'stripe';
import { obterCustomerValido } from './customer';

function criarStripeFake(opts: { retrieve: (...args: unknown[]) => unknown }) {
  return {
    customers: {
      retrieve: vi.fn(opts.retrieve),
    },
  } as unknown as Stripe;
}

describe('obterCustomerValido', () => {
  it('retorna o Customer quando ele existe e não foi deletado', async () => {
    const customerFake = { id: 'cus_1', object: 'customer' as const };
    const stripe = criarStripeFake({ retrieve: async () => customerFake });

    const resultado = await obterCustomerValido(stripe, 'cus_1');

    expect(resultado).toEqual(customerFake);
  });

  it('retorna null quando o Stripe responde resource_missing (customer de outra conta/antiga)', async () => {
    const stripe = criarStripeFake({
      retrieve: async () => {
        throw new Stripe.errors.StripeInvalidRequestError({
          code: 'resource_missing',
          message: 'No such customer: cus_velho',
        });
      },
    });

    const resultado = await obterCustomerValido(stripe, 'cus_velho');

    expect(resultado).toBeNull();
  });

  it('retorna null quando o Customer existe mas está marcado como deleted', async () => {
    const stripe = criarStripeFake({
      retrieve: async () => ({ id: 'cus_2', object: 'customer', deleted: true }),
    });

    const resultado = await obterCustomerValido(stripe, 'cus_2');

    expect(resultado).toBeNull();
  });

  it('propaga outros erros da Stripe (ex.: falha temporária), sem tratá-los como customer obsoleto', async () => {
    const stripe = criarStripeFake({
      retrieve: async () => {
        throw new Stripe.errors.StripeConnectionError({ message: 'timeout de rede' });
      },
    });

    await expect(obterCustomerValido(stripe, 'cus_3')).rejects.toThrow('timeout de rede');
  });

  it('propaga erros que não são da Stripe', async () => {
    const stripe = criarStripeFake({
      retrieve: async () => {
        throw new Error('erro inesperado');
      },
    });

    await expect(obterCustomerValido(stripe, 'cus_4')).rejects.toThrow('erro inesperado');
  });
});
