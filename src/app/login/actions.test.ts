// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { confirmarCodigoAcesso } from './actions';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

const verifyOtp = vi.fn();

beforeEach(() => {
  verifyOtp.mockReset();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { verifyOtp },
  } as never);
});

describe('confirmarCodigoAcesso', () => {
  it('verifica o código de 6 dígitos contra o e-mail informado', async () => {
    verifyOtp.mockResolvedValue({ error: null });

    const resultado = await confirmarCodigoAcesso('teste@rose.app', '123456');

    expect(verifyOtp).toHaveBeenCalledWith({ email: 'teste@rose.app', token: '123456', type: 'email' });
    expect(resultado).toEqual({});
  });

  it('devolve mensagem de erro sanitizada quando o código é inválido', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid', status: 403 } });

    const resultado = await confirmarCodigoAcesso('teste@rose.app', '000000');

    expect(resultado).toEqual({ erro: 'Código inválido ou expirado. Peça um novo código.' });
  });
});
