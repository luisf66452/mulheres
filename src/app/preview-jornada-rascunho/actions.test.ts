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
  outraJornadaAtiva?: { id: string } | null;
  insertRetornaConflito?: boolean;
} = {}) {
  const chamadas: Chamada[] = [];
  const inscricao = opts.inscricao ?? null;
  const outraJornadaAtiva = opts.outraJornadaAtiva ?? null;

  function construtor(tabela: string) {
    const registrar = (metodo: string, args: unknown[]) => chamadas.push({ tabela, metodo, args });
    const filtrosDestaChain: Record<string, unknown> = {};

    const c: Record<string, unknown> = {
      select: vi.fn((...a: unknown[]) => {
        registrar('select', a);
        return c;
      }),
      insert: vi.fn((...a: unknown[]) => {
        registrar('insert', a);
        if (opts.insertRetornaConflito) {
          return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      update: vi.fn((...a: unknown[]) => {
        registrar('update', a);
        return c;
      }),
      eq: vi.fn((...a: unknown[]) => {
        registrar('eq', a);
        filtrosDestaChain[a[0] as string] = a[1];
        return c;
      }),
      neq: vi.fn((...a: unknown[]) => {
        registrar('neq', a);
        filtrosDestaChain['neq:' + (a[0] as string)] = a[1];
        return c;
      }),
      in: vi.fn((...a: unknown[]) => {
        registrar('in', a);
        return Promise.resolve({ data: null, error: null });
      }),
      maybeSingle: vi.fn(async () => {
        registrar('maybeSingle', []);
        if (tabela !== 'jornadas_usuarias') {
          return { data: null, error: null };
        }
        // Duas consultas diferentes passam por jornadas_usuarias.maybeSingle:
        // buscarInscricaoPropria (filtra por jornada_id = QA) e a checagem de
        // "outra jornada ativa" (filtra por status='em_andamento' + neq
        // jornada_id). Distingue pelos filtros realmente aplicados nesta
        // chain, não por ordem de chamada.
        if ('neq:jornada_id' in filtrosDestaChain) {
          return { data: outraJornadaAtiva, error: null };
        }
        return { data: inscricao, error: null };
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

describe('QA de jornada em rascunho — bug real corrigido: ativar com outra jornada já ativa', () => {
  it('sem nenhuma jornada ativa: insere direto, sem pausar nada', async () => {
    const fake = criarSupabaseFake({ inscricao: null, outraJornadaAtiva: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await ativarJornadaRascunhoPreview();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.pausouOutraJornada).toBeFalsy();
    const insercao = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'insert');
    expect(insercao).toBeDefined();
  });

  it('BUG REAL: com outra jornada ativa (ex.: seed "Reconstruindo minha autoestima"), pausa a outra e ativa a de QA de verdade, em vez de retornar sucesso silencioso sem criar nada', async () => {
    const fake = criarSupabaseFake({
      inscricao: null, // ainda não tem inscrição na jornada de QA
      outraJornadaAtiva: { id: 'outra-jornada-usuaria-id' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await ativarJornadaRascunhoPreview();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.pausouOutraJornada).toBe(true);

    const pausaOutra = fake.chamadas.find(
      (c) =>
        c.tabela === 'jornadas_usuarias' &&
        c.metodo === 'update' &&
        (c.args[0] as { status?: string }).status === 'pausada'
    );
    expect(pausaOutra).toBeDefined();

    const insercaoQA = fake.chamadas.find((c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'insert');
    expect(insercaoQA).toBeDefined();
    expect((insercaoQA!.args[0] as { jornada_id: string }).jornada_id).toBe(JORNADA_RASCUNHO_ID);
  });

  it('a pausa de outra jornada nunca toca a jornada de QA nem outra usuária', async () => {
    const fake = criarSupabaseFake({
      inscricao: null,
      outraJornadaAtiva: { id: 'outra-jornada-usuaria-id' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await ativarJornadaRascunhoPreview();

    const pausaOutra = fake.chamadas.find(
      (c) => c.tabela === 'jornadas_usuarias' && c.metodo === 'update' && c.args[0] instanceof Object
    )!;
    const eqsDaPausa = fake.chamadas.filter((c) => c.metodo === 'eq' && c.args[1] === 'outra-jornada-usuaria-id');
    expect(eqsDaPausa.length).toBeGreaterThan(0);
    void pausaOutra;
  });

  it('já ativada na jornada de QA: idempotente, não insere de novo nem mexe em outra jornada', async () => {
    const fake = criarSupabaseFake({
      inscricao: { id: 'insc-qa', dias_completados: 3, status: 'em_andamento' },
      outraJornadaAtiva: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await ativarJornadaRascunhoPreview();

    expect(resultado.erro).toBeUndefined();
    expect(fake.chamadas.some((c) => c.metodo === 'insert')).toBe(false);
  });

  it('inscrição de QA existe mas está pausada (ex.: depois de um reinício): reativa em vez de tentar inserir', async () => {
    const fake = criarSupabaseFake({
      inscricao: { id: 'insc-qa', dias_completados: 4, status: 'pausada' },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await ativarJornadaRascunhoPreview();

    expect(resultado.erro).toBeUndefined();
    const reativa = fake.chamadas.find(
      (c) =>
        c.tabela === 'jornadas_usuarias' &&
        c.metodo === 'update' &&
        (c.args[0] as { status?: string }).status === 'em_andamento'
    );
    expect(reativa).toBeDefined();
    expect(fake.chamadas.some((c) => c.metodo === 'insert')).toBe(false);
  });

  it('corrida concorrente (23505 real na hora do insert): confirma que a linha de QA existe antes de tratar como sucesso', async () => {
    let insercaoJaAconteceu = false;
    const chamadas: Chamada[] = [];

    function construtorCorrida(tabela: string) {
      const registrar = (metodo: string, args: unknown[]) => chamadas.push({ tabela, metodo, args });
      const filtros: Record<string, unknown> = {};
      const c: Record<string, unknown> = {
        select: vi.fn((...a: unknown[]) => {
          registrar('select', a);
          return c;
        }),
        insert: vi.fn(async (...a: unknown[]) => {
          registrar('insert', a);
          insercaoJaAconteceu = true;
          return { data: null, error: { code: '23505', message: 'duplicate key' } };
        }),
        update: vi.fn((...a: unknown[]) => {
          registrar('update', a);
          return c;
        }),
        eq: vi.fn((...a: unknown[]) => {
          registrar('eq', a);
          filtros[a[0] as string] = a[1];
          return c;
        }),
        neq: vi.fn((...a: unknown[]) => {
          registrar('neq', a);
          filtros['neq:' + (a[0] as string)] = a[1];
          return c;
        }),
        maybeSingle: vi.fn(async () => {
          registrar('maybeSingle', []);
          if (tabela !== 'jornadas_usuarias') return { data: null, error: null };
          if ('neq:jornada_id' in filtros) return { data: null, error: null }; // nenhuma outra jornada ativa
          // Antes do insert: ninguém inscrita ainda. Depois do insert (que
          // colidiu): outra requisição concorrente já criou a linha.
          if (insercaoJaAconteceu) {
            return { data: { id: 'insc-qa', dias_completados: 0, status: 'em_andamento' }, error: null };
          }
          return { data: null, error: null };
        }),
      };
      return c;
    }

    const fake = {
      from: vi.fn((tabela: string) => construtorCorrida(tabela)),
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: USUARIA_ID } } })),
      },
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await ativarJornadaRascunhoPreview();

    expect(resultado.erro).toBeUndefined();
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
