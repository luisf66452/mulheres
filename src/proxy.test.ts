// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { proxy } from './proxy';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

function criarSupabaseFake(
  usuario: { id: string } | null,
  perfil?: { consentimento_dados_sensiveis_em: string | null; pais_confirmado_em?: string | null } | null
) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: usuario } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: perfil ?? null })),
        })),
      })),
    })),
  };
}

beforeEach(() => {
  vi.mocked(createServerClient).mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://exemplo.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'chave-anon-de-teste';
});

describe('proxy (middleware)', () => {
  it('permite acesso sem sessão a /api/perfil/confirmar-exclusao — destino do magic link de exclusão de conta, acessado sem sessão sempre que o e-mail é aberto num dispositivo diferente ou após a sessão expirar', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);
    const request = new NextRequest('https://rose.exemplo.com/api/perfil/confirmar-exclusao?code=abc123');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });

  it('redireciona para /login quando não há sessão em rota protegida', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);
    const request = new NextRequest('https://rose.exemplo.com/perfil');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toContain('/login');
  });

  it('permite acesso sem sessão às rotas públicas conhecidas', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);

    for (const rota of ['/login', '/auth/callback', '/privacidade', '/api/stripe/webhook']) {
      const resposta = await proxy(new NextRequest(`https://rose.exemplo.com${rota}`));
      expect(resposta.headers.get('location')).toBeNull();
    }
  });

  it('redireciona para /onboarding quando autenticada mas sem consentimento registrado', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake({ id: 'u1' }, { consentimento_dados_sensiveis_em: null, pais_confirmado_em: null }) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/perfil');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toContain('/onboarding');
  });

  it('redireciona para /onboarding quando tem consentimento mas ainda não confirmou o país', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake(
        { id: 'u1' },
        { consentimento_dados_sensiveis_em: '2026-01-01T00:00:00Z', pais_confirmado_em: null }
      ) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/perfil');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toContain('/onboarding');
  });

  it('não redireciona para /onboarding quem já está indo para /onboarding', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake({ id: 'u1' }, { consentimento_dados_sensiveis_em: null, pais_confirmado_em: null }) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/onboarding');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });

  it('deixa passar quando autenticada, com consentimento e país já confirmados', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake(
        { id: 'u1' },
        { consentimento_dados_sensiveis_em: '2026-01-01T00:00:00Z', pais_confirmado_em: '2026-01-01T00:00:00Z' }
      ) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/perfil');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });
});
