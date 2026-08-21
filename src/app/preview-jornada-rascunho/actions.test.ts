// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ativarJornadaRascunhoPreview,
  liberarProximoDiaQA,
  voltarDiaAnteriorQA,
  reiniciarProgressoQA,
} from './actions';
import { JORNADA_RASCUNHO_ID } from './constantes';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { estaEmPreviewVercel } from '@/lib/supabase/previewOnly';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/supabase/previewOnly', () => ({ estaEmPreviewVercel: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const USUARIA_ID = 'usuaria-propria-123';
const OUTRA_JORNADA_ID = '11111111-1111-1111-1111-111111111111';

type Chamada = { tabela: string; metodo: string; args: unknown[] };

function criarSupabaseFake(opts: {
  inscricao?: { id: string; dias_completados: number; status: string } | null;
} = {}) {
  const chamadas: Chamada[] = [];
  const inscricao = opts.inscricao;

  function construtor(tabela: string) {
    const registrar = (metodo: string, args: unknown[]) => chamadas.push({ tabela, metodo, args });

    const c: Record<string, unknown> = {
      select: vi.fn((...a: unknown[]) => {
        registrar('select', a);
        return c;
      }),
      insert: vi.fn((...a: unknown[]) => {
        registrar('insert', a);
        return Promise.resolve({ data: null, error: null });
      }),
      update: vi.fn((...a: unknown[]) => {
        registrar('update', a);
        return c;
      }),
      eq: vi.fn((...a: unknown[]) => {
        registrar('eq', a);
        return c;
      }),
      in: vi.fn((...a: unknown[]) => {
        registrar('in', a);
        return Promise.resolve({ data: null, error: null });
      }),
      maybeSingle: vi.fn(async () => {
        registrar('maybeSingle', []);
        if (tabela === 'jornadas_usuarias') {
          return { data: inscricao ?? null, error: null };
        }
        return { data: null, error: null };
      }),
    };
    return c;
  }

  const from = vi.fn((tabela: string) => construtor(tabela));

  const getUser = vi.fn(async (): Promise<{ data: { user: { id: string } | null } }> => ({
    data: { user: { id: USUARIA_ID } },
  }));

  return { from, auth: { getUser }, chamadas };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(estaEmPreviewVercel).mockReset();
  vi.mocked(estaEmPreviewVercel).mockReturnValue(true);
});

describe('QA de jornada em rascunho — bloqueios obrigatórios', () => {
  it('bloqueia (404) fora de um deployment de Preview, mesmo autenticada', async () => {
    vi.mocked(estaEmPreviewVercel).mockReturnValue(false);
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(ativarJornadaRascunhoPreview()).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(liberarProximoDiaQA()).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(voltarDiaAnteriorQA()).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(reiniciarProgressoQA()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('a checagem de Preview acontece antes de qualquer leitura/escrita no banco', async () => {
    vi.mocked(estaEmPreviewVercel).mockReturnValue(false);
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(ativarJornadaRascunhoPreview()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(fake.auth.getUser).not.toHaveBeenCalled();
    expect(fake.from).not.toHaveBeenCalled();
  });

  it('bloqueia (redireciona para /login) usuária não autenticada, mesmo em Preview', async () => {
    const fake = criarSupabaseFake();
    fake.auth.getUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(ativarJornadaRascunhoPreview()).rejects.toThrow('NEXT_REDIRECT:/login');
    await expect(liberarProximoDiaQA()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('nunca aceita jornada_id do client: sempre usa a constante JORNADA_RASCUNHO_ID em toda consulta', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 2, status: 'em_andamento' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await liberarProximoDiaQA();

    const chamadasComJornadaId = fake.chamadas.filter(
      (c) => c.metodo === 'eq' && c.args[0] === 'jornada_id'
    );
    expect(chamadasComJornadaId.length).toBeGreaterThan(0);
    for (const chamada of chamadasComJornadaId) {
      expect(chamada.args[1]).toBe(JORNADA_RASCUNHO_ID);
      expect(chamada.args[1]).not.toBe(OUTRA_JORNADA_ID);
    }
  });

  it('toda escrita em jornadas_usuarias é filtrada por usuaria_id = auth.uid(), nunca outro id', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 2, status: 'em_andamento' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await liberarProximoDiaQA();

    const chamadasComUsuariaId = fake.chamadas.filter(
      (c) => c.metodo === 'eq' && c.args[0] === 'usuaria_id'
    );
    expect(chamadasComUsuariaId.length).toBeGreaterThan(0);
    for (const chamada of chamadasComUsuariaId) {
      expect(chamada.args[1]).toBe(USUARIA_ID);
    }
  });

  it('insert de ativação nunca envia usuaria_id diferente da sessão', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await ativarJornadaRascunhoPreview();

    const insercao = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'insert');
    expect(insercao).toBeDefined();
    const payload = insercao!.args[0] as { usuaria_id: string; jornada_id: string };
    expect(payload.usuaria_id).toBe(USUARIA_ID);
    expect(payload.jornada_id).toBe(JORNADA_RASCUNHO_ID);
  });
});

describe('QA de jornada em rascunho — progresso e pétalas', () => {
  it('liberar o próximo dia nunca ultrapassa a duração da jornada (9 dias)', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 9, status: 'concluida' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await liberarProximoDiaQA();
    expect(resultado.erro).toBeUndefined();

    const update = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'update');
    const payload = update!.args[0] as { dias_completados: number };
    expect(payload.dias_completados).toBe(9);
  });

  it('voltar um dia nunca fica negativo', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 0, status: 'em_andamento' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await voltarDiaAnteriorQA();

    const update = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'update');
    const payload = update!.args[0] as { dias_completados: number };
    expect(payload.dias_completados).toBe(0);
  });

  it('reiniciar o progresso de QA nunca toca em sessoes, transacoes_petalas ou carteiras_petalas — histórico de pétalas fica intacto', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 5, status: 'em_andamento' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'ativ-1' }, { id: 'ativ-2' }], error: null }),
      })),
    } as never);

    await reiniciarProgressoQA();

    const tabelasTocadas = new Set(fake.chamadas.map((c) => c.tabela));
    expect(tabelasTocadas.has('sessoes')).toBe(false);
    expect(tabelasTocadas.has('transacoes_petalas')).toBe(false);
    expect(tabelasTocadas.has('carteiras_petalas')).toBe(false);

    const zeraProgresso = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'update');
    expect((zeraProgresso!.args[0] as { dias_completados: number }).dias_completados).toBe(0);
  });

  it('reiniciar o progresso de QA limpa só as respostas da própria usuária, nunca de outra', async () => {
    const fake = criarSupabaseFake({ inscricao: { id: 'insc-1', dias_completados: 3, status: 'em_andamento' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'ativ-1' }], error: null }),
      })),
    } as never);

    await reiniciarProgressoQA();

    const limpaRespostas = fake.chamadas.find(
      (c) => c.tabela === 'jornada_respostas_modulo' && c.metodo === 'eq' && c.args[0] === 'user_id'
    );
    expect(limpaRespostas).toBeDefined();
    expect(limpaRespostas!.args[1]).toBe(USUARIA_ID);
  });

  it('sem inscrição ativa, ajustar dias retorna erro em vez de criar/alterar qualquer linha', async () => {
    const fake = criarSupabaseFake({ inscricao: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await liberarProximoDiaQA();

    expect(resultado.erro).toBeDefined();
    expect(fake.chamadas.some((c) => c.metodo === 'update')).toBe(false);
  });
});
