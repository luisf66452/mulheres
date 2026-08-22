// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JornadaDetalhePage from './page';
import { buscarJornadaPorSlug, listarSessoesEmOrdem } from '@/lib/jornadas-conteudo/dados';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  usePathname: () => '/jornadas/imagem-corporal',
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';

function criarSupabaseFake(
  progresso: { sessao_id: string; iniciada_em: string; concluida_em: string | null }[]
) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    then: (resolve: (result: { data: typeof progresso; error: null }) => void) =>
      resolve({ data: progresso, error: null }),
  };
  return {
    from: vi.fn(() => query),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'usuaria-1' } } })) },
  };
}

describe('JornadaDetalhePage', () => {
  it('a primeira sessão desbloqueada é um link clicável para a rota individual', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake([]) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );

    const jornada = buscarJornadaPorSlug('imagem-corporal')!;
    const primeiraSessao = listarSessoesEmOrdem(jornada)[0];

    const jsx = await JornadaDetalhePage({ params: Promise.resolve({ slug: 'imagem-corporal' }) });
    render(jsx);

    const link = screen.getByRole('link', { name: new RegExp(primeiraSessao.titulo) });
    expect(link).toHaveAttribute('href', `/jornadas/imagem-corporal/${primeiraSessao.id}`);
  });

  it('uma sessão bloqueada não é um link — é apenas um bloco não interativo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseFake([]) as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );

    const jornada = buscarJornadaPorSlug('imagem-corporal')!;
    const segundaSessao = listarSessoesEmOrdem(jornada)[1];

    const jsx = await JornadaDetalhePage({ params: Promise.resolve({ slug: 'imagem-corporal' }) });
    render(jsx);

    expect(screen.queryByRole('link', { name: new RegExp(segundaSessao.titulo) })).not.toBeInTheDocument();
    expect(screen.getByText(segundaSessao.titulo).closest('[aria-disabled="true"]')).not.toBeNull();
  });
});
