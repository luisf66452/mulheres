import { describe, it, expect, vi } from 'vitest';
import { concederPetalas } from './concederPetalas';

function criarSupabaseMock(resultado: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(resultado),
  } as never;
}

describe('concederPetalas', () => {
  it('retorna a quantidade quando a RPC confirma concessão', async () => {
    const supabase = criarSupabaseMock({
      data: [{ concedido: true, saldo: 15, limite_gratuito_atingido: false }],
      error: null,
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toEqual({ quantidade: 5, limiteGratuitoAtingido: false });
  });

  it('retorna quantidade nula quando a RPC indica que já foi concedido antes', async () => {
    const supabase = criarSupabaseMock({
      data: [{ concedido: false, saldo: 15, limite_gratuito_atingido: false }],
      error: null,
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toEqual({ quantidade: null, limiteGratuitoAtingido: false });
  });

  it('retorna limiteGratuitoAtingido quando a RPC bloqueia pelo teto gratuito', async () => {
    const supabase = criarSupabaseMock({
      data: [{ concedido: false, saldo: 1000, limite_gratuito_atingido: true }],
      error: null,
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toEqual({ quantidade: null, limiteGratuitoAtingido: true });
  });

  it('retorna quantidade nula e não lança quando a RPC retorna erro', async () => {
    const supabase = criarSupabaseMock({
      data: null,
      error: { message: 'falha de rede' },
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toEqual({ quantidade: null, limiteGratuitoAtingido: false });
  });

  it('retorna quantidade nula quando o client é null (env ausente)', async () => {
    const resultado = await concederPetalas(null, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toEqual({ quantidade: null, limiteGratuitoAtingido: false });
  });
});
