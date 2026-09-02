// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComecarResultadoPage from './page';

vi.mock('@/lib/stripe/client', () => ({ obterStripe: vi.fn() }));

import { obterStripe } from '@/lib/stripe/client';

function criarStripeFake() {
  return {
    prices: {
      retrieve: vi.fn(async (priceId: string) => {
        if (priceId === 'price_mensal_teste') {
          return { currency: 'brl', unit_amount: 3999, currency_options: { brl: { unit_amount: 3999 } } };
        }
        return { currency: 'brl', unit_amount: 35999, currency_options: { brl: { unit_amount: 35999 } } };
      }),
    },
  };
}

describe('ComecarResultadoPage', () => {
  beforeEach(() => {
    vi.mocked(obterStripe).mockReset();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_teste');
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
    vi.stubEnv('STRIPE_PRICE_ID_ANUAL', 'price_anual_teste');
  });

  it('busca o preço em BRL por padrão e calcula o desconto real do anual', async () => {
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake() as never);

    const jsx = await ComecarResultadoPage();

    expect(jsx.props).toEqual({
      precoMensal: 'R$ 39,99',
      precoAnual: 'R$ 359,99',
      percentualEconomiaAnual: 25,
      precoAnualPorMes: 'R$ 30,00',
      precoMensalPorDia: 'R$ 1,33',
    });
  });

  it('quando o Stripe não está configurado, passa preços nulos sem quebrar', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    const jsx = await ComecarResultadoPage();

    expect(jsx.props).toEqual({
      precoMensal: null,
      precoAnual: null,
      percentualEconomiaAnual: null,
      precoAnualPorMes: null,
      precoMensalPorDia: null,
    });
  });
});
