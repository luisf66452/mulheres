// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obterDownloadEbook } from './ebook';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

function criarStripeFake(session: { payment_status: string; amount_total?: number; currency?: string }) {
  return {
    checkout: {
      sessions: { retrieve: vi.fn(async () => session) },
    },
  };
}

function criarAdminFake(signedUrlResultado: { data: { signedUrl: string } | null; error: unknown }) {
  return {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async () => signedUrlResultado),
      })),
    },
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseAdminClient).mockReset();
});

describe('obterDownloadEbook', () => {
  it('retorna confirmado=true, a signed url e o valor/moeda quando o pagamento está pago', async () => {
    const stripeFake = criarStripeFake({ payment_status: 'paid', amount_total: 1999, currency: 'brl' });
    const adminFake = criarAdminFake({ data: { signedUrl: 'https://storage.exemplo.com/assinada' }, error: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_pago');

    expect(resultado).toEqual({
      confirmado: true,
      urlDownload: 'https://storage.exemplo.com/assinada',
      valor: 19.99,
      moeda: 'BRL',
    });
  });

  it('retorna confirmado=false e valor/moeda nulos quando o pagamento não está pago', async () => {
    const stripeFake = criarStripeFake({ payment_status: 'unpaid', amount_total: 1999, currency: 'brl' });

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_nao_pago');

    expect(resultado).toEqual({ confirmado: false, urlDownload: null, valor: null, moeda: null });
  });

  it('retorna confirmado=false quando o Stripe lança erro ao buscar a sessão (session_id inválido/forjado)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = {
      checkout: {
        sessions: {
          retrieve: vi.fn(async () => {
            throw new Error('No such checkout session');
          }),
        },
      },
    };

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_forjado');

    expect(resultado).toEqual({ confirmado: false, urlDownload: null, valor: null, moeda: null });
    spyConsole.mockRestore();
  });

  it('retorna confirmado=true, valor/moeda mas urlDownload=null quando pago mas a signed url falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stripeFake = criarStripeFake({ payment_status: 'paid', amount_total: 1999, currency: 'brl' });
    const adminFake = criarAdminFake({ data: null, error: { message: 'objeto não encontrado' } });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resultado = await obterDownloadEbook(stripeFake as never, 'cs_teste_pago');

    expect(resultado).toEqual({ confirmado: true, urlDownload: null, valor: 19.99, moeda: 'BRL' });
    spyConsole.mockRestore();
  });
});
