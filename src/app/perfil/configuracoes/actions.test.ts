// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atualizarFusoHorario } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

const USUARIA_ID = 'sessao-usuaria-123';
const ID_INJETADO_PELO_CLIENT = 'outra-usuaria-xyz';

function criarSupabaseFake(opts: {
  user: { id: string } | null;
  erroUpdate?: { code?: string; message: string } | null;
}) {
  const chamadasUpdate: unknown[] = [];
  const chamadasEq: Array<{ coluna: string; valor: unknown }> = [];

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: opts.user } })),
    },
    from: vi.fn((tabela: string) => {
      if (tabela !== 'perfis') throw new Error(`tabela inesperada em teste: ${tabela}`);
      return {
        update: vi.fn((payload: unknown) => {
          chamadasUpdate.push(payload);
          return {
            eq: vi.fn((coluna: string, valor: unknown) => {
              chamadasEq.push({ coluna, valor });
              return Promise.resolve({ error: opts.erroUpdate ?? null });
            }),
          };
        }),
      };
    }),
    __chamadasUpdate: chamadasUpdate,
    __chamadasEq: chamadasEq,
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
});

describe('atualizarFusoHorario', () => {
  it('rejeita fuso fora da lista suportada sem consultar o Supabase', async () => {
    const fake = criarSupabaseFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await atualizarFusoHorario('Europe/Paris');

    expect(resultado.erro).toBe('Selecione um fuso horário válido.');
    expect(fake.from).not.toHaveBeenCalled();
  });

  it('rejeita string vazia ou arbitrária', async () => {
    const fake = criarSupabaseFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await atualizarFusoHorario('');
    expect(resultado.erro).toBeDefined();
  });

  it('redireciona para /login sem autenticação, sem atualizar nada', async () => {
    const fake = criarSupabaseFake({ user: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(atualizarFusoHorario('America/Sao_Paulo')).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(fake.from).not.toHaveBeenCalled();
  });

  it('atualiza fuso_horario sempre pelo id da sessão do servidor, nunca por um id do client', async () => {
    const fake = criarSupabaseFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await atualizarFusoHorario('Europe/Lisbon');

    expect(resultado.sucesso).toBe(true);
    expect(fake.__chamadasUpdate[0]).toEqual({ fuso_horario: 'Europe/Lisbon' });
    expect(fake.__chamadasEq[0]).toEqual({ coluna: 'id', valor: USUARIA_ID });
    expect(fake.__chamadasEq[0].valor).not.toBe(ID_INJETADO_PELO_CLIENT);
  });

  it('só envia a coluna fuso_horario, nunca nome/frase/faixa etária', async () => {
    const fake = criarSupabaseFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await atualizarFusoHorario('America/Manaus');

    expect(Object.keys(fake.__chamadasUpdate[0] as object)).toEqual(['fuso_horario']);
  });

  it('retorna erro genérico e sanitizado quando o Supabase falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({
      user: { id: USUARIA_ID },
      erroUpdate: { code: '42501', message: 'detalhe interno do banco' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await atualizarFusoHorario('America/Rio_Branco');

    expect(resultado.erro).toBe('Não foi possível salvar o fuso horário agora. Tente novamente.');
    expect(resultado.erro).not.toContain('detalhe interno do banco');
    spyConsole.mockRestore();
  });
});
