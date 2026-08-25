// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GET } from './route';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

const exchangeCodeForSession = vi.fn();

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { exchangeCodeForSession },
  } as never);
});

describe('GET /auth/callback', () => {
  it('marca o retorno de um login concluído para abrir a oferta pós-login', async () => {
    const resposta = await GET(
      new NextRequest('https://somosrose.space/auth/callback?code=codigo-valido')
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith('codigo-valido');
    expect(resposta.headers.get('location')).toBe('https://somosrose.space/?entrada=1');
  });

  it('mantém a mensagem de erro sanitizada quando a troca do código falha', async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'Código expirado' } });

    const resposta = await GET(
      new NextRequest('https://somosrose.space/auth/callback?code=codigo-expirado')
    );

    expect(resposta.headers.get('location')).toBe(
      'https://somosrose.space/login?erro=C%C3%B3digo%20expirado'
    );
  });
});
