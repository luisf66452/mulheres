// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PraticaBibliotecaPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  usePathname: () => '/praticas/p1',
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

type PraticaLinha = {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  status: string;
  is_pro: boolean;
};

function criarSupabaseFake(pratica: PraticaLinha | null, plano: 'free' | 'premium' | null) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: plano === null ? null : { id: 'usuaria-1' } } })) },
    from(tabela: string) {
      if (tabela === 'praticas') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: pratica, error: pratica ? null : { code: 'PGRST116' } }),
              }),
            }),
          }),
        };
      }
      if (tabela === 'perfis') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: plano ? { plano } : null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };
}

describe('PraticaBibliotecaPage — paywall Pro server-side', () => {
  it('mostra o conteúdo normalmente quando a prática não é Pro', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p1', titulo: 'Respiração', conteudo: 'texto completo', categoria: 'aterramento', status: 'publicada', is_pro: false },
        null
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p1' }) });
    render(jsx);
    expect(screen.getByText('texto completo')).toBeInTheDocument();
  });

  it('bloqueia o conteúdo Pro para uma usuária sem sessão (não confia em cliente nenhum)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p2', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        null
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p2' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Rose Pro/i).length).toBeGreaterThan(0);
  });

  it('bloqueia o conteúdo Pro para uma usuária logada no plano free', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p3', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        'free'
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p3' }) });
    render(jsx);
    expect(screen.queryByText('conteúdo pago')).not.toBeInTheDocument();
  });

  it('libera o conteúdo Pro para uma usuária premium', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake(
        { id: 'p4', titulo: 'Prática avançada', conteudo: 'conteúdo pago', categoria: 'aterramento', status: 'publicada', is_pro: true },
        'premium'
      ) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
    const jsx = await PraticaBibliotecaPage({ params: Promise.resolve({ id: 'p4' }) });
    render(jsx);
    expect(screen.getByText('conteúdo pago')).toBeInTheDocument();
  });
});
