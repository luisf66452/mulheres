// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { proxy, config } from './proxy';

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

  it('permite acesso sem sessão a /seguranca — o espaço "Preciso de ajuda agora" nunca pode depender de login', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);
    const request = new NextRequest('https://rose.exemplo.com/seguranca');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });

  it('permite acesso a /seguranca mesmo autenticada sem consentimento/país confirmados (não força /onboarding)', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      criarSupabaseFake({ id: 'u1' }, { consentimento_dados_sensiveis_em: null, pais_confirmado_em: null }) as never
    );
    const request = new NextRequest('https://rose.exemplo.com/seguranca');

    const resposta = await proxy(request);

    expect(resposta.headers.get('location')).toBeNull();
  });

  it('permite acesso sem sessão às rotas públicas conhecidas', async () => {
    vi.mocked(createServerClient).mockReturnValue(criarSupabaseFake(null) as never);

    for (const rota of ['/login', '/auth/callback', '/comecar', '/privacidade', '/api/stripe/webhook', '/api/push/send-due']) {
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

describe('config.matcher (regex de rotas em que o middleware roda)', () => {
  // O matcher é lido pelo Next.js em tempo de build/roteamento, antes mesmo
  // do proxy() ser invocado — por isso testamos a regex exportada
  // diretamente, sem duplicar o padrão à mão, para que o teste não fique
  // dessincronizado do config real. Ancoramos com ^...$ porque é assim que
  // o Next.js compila matchers de rota (path-to-regexp casa o pathname
  // inteiro) — sem ancorar, RegExp#test faria correspondência parcial em
  // qualquer posição da string e produziria falsos positivos (ex.:
  // "/_next/static/x.js" bateria a partir do "/" antes de "static").
  const matcherRegex = new RegExp(`^${config.matcher[0]}$`);

  it('exclui /manifest.webmanifest (rota gerada por src/app/manifest.ts) da execução do middleware', () => {
    expect(matcherRegex.test('/manifest.webmanifest')).toBe(false);
  });

  it('exclui /sw.js (service worker registrado em toda página, inclusive /login, antes de existir sessão) da execução do middleware', () => {
    expect(matcherRegex.test('/sw.js')).toBe(false);
  });

  it('continua executando o middleware em rotas protegidas normais', () => {
    expect(matcherRegex.test('/perfil')).toBe(true);
  });

  it('continua executando o middleware em uma rota de API sensivel (garante que as exclusoes de asset estatico nao ampliaram demais e engoliram uma rota protegida)', () => {
    expect(matcherRegex.test('/api/perfil/excluir-conta')).toBe(true);
  });

  it('continua excluindo favicon.ico, icons e assets estáticos do _next', () => {
    expect(matcherRegex.test('/favicon.ico')).toBe(false);
    expect(matcherRegex.test('/icon.png')).toBe(false);
    expect(matcherRegex.test('/_next/static/x.js')).toBe(false);
  });
});
