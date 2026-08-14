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
      data: [{ concedido: true, saldo: 15 }],
      error: null,
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toBe(5);
  });

  it('retorna null quando a RPC indica que já foi concedido antes', async () => {
    const supabase = criarSupabaseMock({
      data: [{ concedido: false, saldo: 15 }],
      error: null,
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toBeNull();
  });

  it('retorna null e não lança quando a RPC retorna erro', async () => {
    const supabase = criarSupabaseMock({
      data: null,
      error: { message: 'falha de rede' },
    });
    const resultado = await concederPetalas(supabase, 'user-1', 'checkin_diario', 'ref-1', 5);
    expect(resultado).toBeNull();
  });
});
