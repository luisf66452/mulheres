// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FavoritosPage from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/favoritos',
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type FavoritoLinha = { id: string; pratica_id: string | null; sessao_id: string | null; criado_em: string };
type PraticaLinha = { id: string; titulo: string; conteudo: string; categoria: string; status: string };

function criarSupabaseFake(favoritos: FavoritoLinha[], praticas: PraticaLinha[]) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'usuaria-1' } } })) },
    from(tabela: string) {
      if (tabela === 'favoritos') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: favoritos, error: null }),
            }),
          }),
        };
      }
      if (tabela === 'praticas') {
        return {
          select: () => ({
            in: async () => ({ data: praticas, error: null }),
          }),
        };
      }
      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };
}

describe('FavoritosPage', () => {
  it('mostra uma mensagem de vazio quando não há favoritos', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake([], []) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText(/ainda não favoritou/i)).toBeInTheDocument();
  });

  it('resolve o título de uma prática favoritada via join', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-1', pratica_id: 'pratica-1', sessao_id: null, criado_em: '2026-08-20T10:00:00.000Z' }],
        [{ id: 'pratica-1', titulo: 'Respiração 4-7-8', conteudo: 'texto', categoria: 'aterramento', status: 'publicada' }]
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Respiração 4-7-8')).toBeInTheDocument();
  });

  it('resolve o título de uma sessão favoritada via catálogo em código', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-2', pratica_id: null, sessao_id: 'imagem-corporal-m1-s1', criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Imagem corporal não é o seu corpo')).toBeInTheDocument();
  });

  it('mostra "Conteúdo indisponível" para uma prática removida/despublicada, sem quebrar a página', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-3', pratica_id: 'pratica-removida', sessao_id: null, criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Conteúdo indisponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument();
  });

  it('mostra "Conteúdo indisponível" para uma sessão que não existe mais no catálogo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        [{ id: 'fav-4', pratica_id: null, sessao_id: 'sessao-removida-do-catalogo', criado_em: '2026-08-20T10:00:00.000Z' }],
        []
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await FavoritosPage();
    render(jsx);
    expect(screen.getByText('Conteúdo indisponível')).toBeInTheDocument();
  });
});
