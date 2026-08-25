import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { favoritar, desfavoritar } from './actions';

const USUARIA_ID = 'usuaria-favoritos-1';

function criarSupabaseFake(opcoes: {
  praticaEncontrada?: { id: string } | null;
  insertError?: { code: string; message: string } | null;
  deleteError?: { code: string; message: string } | null;
}) {
  const chamadasInsert: unknown[] = [];
  const chamadasDelete: { coluna: string; valor: unknown }[] = [];

  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USUARIA_ID } } })) },
    from(tabela: string) {
      if (tabela === 'praticas') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opcoes.praticaEncontrada ?? null, error: null }),
              }),
            }),
          }),
        };
      }

      if (tabela === 'favoritos') {
        const builder = {
          insert(valores: unknown) {
            chamadasInsert.push(valores);
            return Promise.resolve({ data: null, error: opcoes.insertError ?? null });
          },
          delete() {
            return builder;
          },
          eq(coluna: string, valor: unknown) {
            chamadasDelete.push({ coluna, valor });
            return builder;
          },
          then(resolve: (v: { data: null; error: unknown }) => void) {
            resolve({ data: null, error: opcoes.deleteError ?? null });
          },
        };
        return builder;
      }

      throw new Error(`tabela inesperada no fake: ${tabela}`);
    },
  };

  return { client: client as unknown as SupabaseClient<Database>, chamadasInsert, chamadasDelete };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('favoritar', () => {
  it('favorita uma prática publicada e existente', async () => {
    const { client, chamadasInsert } = criarSupabaseFake({ praticaEncontrada: { id: 'pratica-1' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await favoritar('pratica', 'pratica-1');

    expect(chamadasInsert).toEqual([{ usuaria_id: USUARIA_ID, pratica_id: 'pratica-1', sessao_id: null }]);
  });

  it('rejeita favoritar uma prática que não existe ou não está publicada', async () => {
    const { client } = criarSupabaseFake({ praticaEncontrada: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-inexistente')).rejects.toThrow();
  });

  it('trata violação de unique (23505) como sucesso idempotente — favorito duplicado', async () => {
    const { client } = criarSupabaseFake({
      praticaEncontrada: { id: 'pratica-1' },
      insertError: { code: '23505', message: 'duplicate key' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).resolves.toBeUndefined();
  });

  it('propaga qualquer outro erro de insert que não seja 23505', async () => {
    const { client } = criarSupabaseFake({
      praticaEncontrada: { id: 'pratica-1' },
      insertError: { code: '42501', message: 'permission denied' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).rejects.toThrow();
  });

  it('favorita uma sessão que existe no catálogo de jornadas-conteudo', async () => {
    const { client, chamadasInsert } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await favoritar('sessao', 'imagem-corporal-m1-s1');

    expect(chamadasInsert).toEqual([{ usuaria_id: USUARIA_ID, pratica_id: null, sessao_id: 'imagem-corporal-m1-s1' }]);
  });

  it('rejeita favoritar uma sessão que não existe no catálogo', async () => {
    const { client } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('sessao', 'sessao-que-nao-existe')).rejects.toThrow();
  });

  it('redireciona para /login quando não há usuária autenticada', async () => {
    const { client } = criarSupabaseFake({});
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(favoritar('pratica', 'pratica-1')).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});

describe('desfavoritar', () => {
  it('remove um favorito de prática filtrando por usuaria_id e pratica_id', async () => {
    const { client, chamadasDelete } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await desfavoritar('pratica', 'pratica-1');

    expect(chamadasDelete).toEqual([
      { coluna: 'usuaria_id', valor: USUARIA_ID },
      { coluna: 'pratica_id', valor: 'pratica-1' },
    ]);
  });

  it('remove um favorito de sessão filtrando por usuaria_id e sessao_id', async () => {
    const { client, chamadasDelete } = criarSupabaseFake({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await desfavoritar('sessao', 'imagem-corporal-m1-s1');

    expect(chamadasDelete).toEqual([
      { coluna: 'usuaria_id', valor: USUARIA_ID },
      { coluna: 'sessao_id', valor: 'imagem-corporal-m1-s1' },
    ]);
  });

  it('propaga erro de exclusão', async () => {
    const { client } = criarSupabaseFake({ deleteError: { code: '42501', message: 'permission denied' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(desfavoritar('pratica', 'pratica-1')).rejects.toThrow();
  });
});
