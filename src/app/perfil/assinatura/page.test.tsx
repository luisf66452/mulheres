// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssinaturaPage from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
  usePathname: () => '/perfil/assinatura',
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/stripe/client', () => ({ obterStripe: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { obterStripe } from '@/lib/stripe/client';

function criarSupabaseFake(perfil: { plano: string; pais: string | null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(async () => ({ data: perfil, error: null })),
  };
  return {
    from: vi.fn(() => query),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'usuaria-1' } } })) },
  };
}

function criarStripeFake() {
  return {
    prices: {
      retrieve: vi.fn(async (priceId: string) => {
        if (priceId === 'price_mensal_teste') {
          return {
            currency: 'eur',
            unit_amount: 999,
            currency_options: { eur: { unit_amount: 999 }, brl: { unit_amount: 3999 } },
          };
        }
        return {
          currency: 'eur',
          unit_amount: 8999,
          currency_options: { eur: { unit_amount: 8999 }, brl: { unit_amount: 35999 } },
        };
      }),
    },
  };
}

describe('AssinaturaPage', () => {
  beforeEachSetup();

  it('mostra o preço em BRL para a usuária brasileira, antes do redirecionamento', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake({ plano: 'free', pais: 'BR' }) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake() as never);

    const jsx = await AssinaturaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/R\$ 39,99/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 359,99/)).toBeInTheDocument();
  });

  it('mostra o preço em EUR para a usuária de Portugal, antes do redirecionamento', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake({ plano: 'free', pais: 'PT' }) as unknown as Awaited<
        ReturnType<typeof createSupabaseServerClient>
      >
    );
    vi.mocked(obterStripe).mockReturnValue(criarStripeFake() as never);

    const jsx = await AssinaturaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/Mensal: 9,99 €/)).toBeInTheDocument();
    expect(screen.getByText(/Anual: 89,99 €/)).toBeInTheDocument();
  });
});

function beforeEachSetup() {
  beforeEach(() => {
    vi.mocked(createSupabaseServerClient).mockReset();
    vi.mocked(obterStripe).mockReset();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_teste');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_teste');
    vi.stubEnv('STRIPE_PRICE_ID_MENSAL', 'price_mensal_teste');
    vi.stubEnv('STRIPE_PRICE_ID_ANUAL', 'price_anual_teste');
  });
}
