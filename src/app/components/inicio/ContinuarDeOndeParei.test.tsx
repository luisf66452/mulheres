// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import ContinuarDeOndeParei from './ContinuarDeOndeParei';

type LinhaProgressoRaw = { jornada_slug: string; sessao_id: string; iniciada_em: string; concluida_em: string | null };

function criarSupabaseFake(linhas: LinhaProgressoRaw[] | 'erro') {
  return {
    from: () => ({
      select: () => ({
        eq: async () => (linhas === 'erro' ? { data: null, error: { code: '500', message: 'falhou' } } : { data: linhas, error: null }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('ContinuarDeOndeParei', () => {
  it('Prioridade 1: mostra a sessão em andamento como um link para retomar', async () => {
    const supabase = criarSupabaseFake([
      { jornada_slug: 'imagem-corporal', sessao_id: 'imagem-corporal-m1-s2', iniciada_em: '2026-08-20T10:00:00.000Z', concluida_em: null },
    ]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jornadas/imagem-corporal/imagem-corporal-m1-s2');
  });

  it('Prioridade 2: sem sessão em andamento, mostra a próxima sessão desbloqueada', async () => {
    const supabase = criarSupabaseFake([
      { jornada_slug: 'imagem-corporal', sessao_id: 'imagem-corporal-m1-s1', iniciada_em: '2026-08-18T10:00:00.000Z', concluida_em: '2026-08-18T10:05:00.000Z' },
    ]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jornadas/imagem-corporal/imagem-corporal-m1-s2');
  });

  it('Prioridade 3: sem nada no sistema de jornadas, cai para o fallback local (renderiza o wrapper client, sem link de jornada)', async () => {
    const supabase = criarSupabaseFake([]);
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('em caso de erro na consulta de progresso, cai para o fallback local em vez de quebrar a Home', async () => {
    const supabase = criarSupabaseFake('erro');
    const jsx = await ContinuarDeOndeParei({ supabase, usuariaId: 'usuaria-1' });
    render(jsx);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
