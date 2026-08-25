// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SegurancaPage from './page';
import type { RecursoSeguranca } from '@/lib/supabase/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type RecursoFake = Pick<RecursoSeguranca, 'id' | 'titulo' | 'corpo' | 'ordem'>;

function criarSupabaseServerFake(opcoes: {
  usuario?: { id: string } | null;
  perfil?: { pais: string; pais_confirmado_em: string | null } | null;
}) {
  const { usuario = null, perfil = null } = opcoes;
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: usuario } })) },
    from: vi.fn((tabela: string) => {
      if (tabela === 'perfis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: perfil })),
            })),
          })),
        };
      }
      throw new Error(`tabela inesperada no cliente autenticado durante o teste: ${tabela}`);
    }),
  };
}

// recursos_seguranca é lida sempre pelo admin client (service role, ignora
// RLS) — a tabela não tem GRANT nem policy para `anon` (o projeto nunca
// concede acesso a `anon`), então a única forma de funcionar sem sessão é
// não passar pelo cliente autenticado nesta consulta específica.
function criarSupabaseAdminFake(opcoes: { recursos?: RecursoFake[]; erroRecursos?: boolean }) {
  const { recursos = [], erroRecursos = false } = opcoes;
  const chamadasRecursos: { metodo: string; args: unknown[] }[] = [];

  return {
    client: {
      from: vi.fn((tabela: string) => {
        if (tabela === 'recursos_seguranca') {
          const query = {
            select: vi.fn(() => query),
            eq: vi.fn((...args: unknown[]) => {
              chamadasRecursos.push({ metodo: 'eq', args });
              return query;
            }),
            not: vi.fn((...args: unknown[]) => {
              chamadasRecursos.push({ metodo: 'not', args });
              return query;
            }),
            order: vi.fn(async () =>
              erroRecursos ? { data: null, error: new Error('falhou') } : { data: recursos, error: null }
            ),
          };
          return query;
        }
        throw new Error(`tabela inesperada no admin client durante o teste: ${tabela}`);
      }),
    },
    chamadasRecursos,
  };
}

describe('SegurancaPage', () => {
  it('funciona sem sessão: mostra o seletor de país quando não há usuária e nenhum ?pais= foi escolhido', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake({}).client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Brasil' })).toBeTruthy();
    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
  });

  it('sem sessão, mas com ?pais=BR: usa o país da querystring e mostra o número de emergência do Brasil', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      criarSupabaseAdminFake({
        recursos: [{ id: 'r1', titulo: 'Apoio emocional gratuito', corpo: 'Ligue 188.', ordem: 1 }],
      }).client as never
    );

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.queryByRole('button', { name: 'Portugal' })).toBeNull();
    expect(screen.getByText('Apoio emocional gratuito')).toBeTruthy();
    const linkTel = screen.getByRole('link', { name: /192/ });
    expect(linkTel.getAttribute('href')).toBe('tel:192');
  });

  it('com sessão e país confirmado no perfil: usa o país da conta e ignora um ?pais= diferente na querystring', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({
        usuario: { id: 'u1' },
        perfil: { pais: 'PT', pais_confirmado_em: '2026-01-01T00:00:00Z' },
      }) as never
    );
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      criarSupabaseAdminFake({
        recursos: [{ id: 'r1', titulo: 'Linha Nacional de Prevenção do Suicídio', corpo: 'Ligue 1411.', ordem: 1 }],
      }).client as never
    );

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.getByText('Linha Nacional de Prevenção do Suicídio')).toBeTruthy();
    const linkTel = screen.getByRole('link', { name: /112/ });
    expect(linkTel.getAttribute('href')).toBe('tel:112');
  });

  it('com sessão mas sem país confirmado: cai para o seletor manual, igual a uma visita sem sessão', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ usuario: { id: 'u1' }, perfil: { pais: 'BR', pais_confirmado_em: null } }) as never
    );
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake({}).client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByRole('button', { name: 'Portugal' })).toBeTruthy();
  });

  it('a consulta filtra por fonte e verificado_em preenchidos (contatos não verificados não devem aparecer)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    const { client, chamadasRecursos } = criarSupabaseAdminFake({ recursos: [] });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });

    const metodosNot = chamadasRecursos.filter((c) => c.metodo === 'not').map((c) => c.args);
    expect(metodosNot).toContainEqual(['fonte', 'is', null]);
    expect(metodosNot).toContainEqual(['verificado_em', 'is', null]);
  });

  it('resiliente quando a consulta falha: ainda mostra a orientação fixa e o número de emergência', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake({ erroRecursos: true }).client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });
    render(jsx);

    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /112/ }).getAttribute('href')).toBe('tel:112');
  });

  it('resiliente quando a consulta vem vazia: ainda mostra a orientação fixa', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake({ recursos: [] }).client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'BR' }) });
    render(jsx);

    expect(screen.getByText('A Rose não acompanha emergências em tempo real.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /192/ }).getAttribute('href')).toBe('tel:192');
  });

  it('mostra o botão "Voltar ao app"', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ usuario: null }) as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake({}).client as never);

    const jsx = await SegurancaPage({ searchParams: Promise.resolve({ pais: 'PT' }) });
    render(jsx);

    expect(screen.getByRole('link', { name: 'Voltar ao app' })).toBeTruthy();
  });
});
