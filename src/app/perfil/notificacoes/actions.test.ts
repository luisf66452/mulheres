// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  salvarPreferenciasNotificacao,
  pausarNotificacoes,
  reativarNotificacoes,
  listarDispositivos,
  removerDispositivo,
  enviarNotificacaoTeste,
} from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { enviarParaSubscricoes } from '@/lib/push/enviar';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/push/enviar', () => ({ enviarParaSubscricoes: vi.fn() }));

const USUARIA_ID = 'usuaria-propria-123';

type Chamada = { tabela: string; metodo: string; args: unknown[] };

function criarSupabaseFake(opts: {
  usuaria?: { id: string } | null;
  subscriptions?: { id: string; endpoint: string; p256dh: string; auth: string }[];
} = {}) {
  const chamadas: Chamada[] = [];
  const subscriptions = opts.subscriptions ?? [];

  function construtor(tabela: string) {
    const registrar = (metodo: string, args: unknown[]) => chamadas.push({ tabela, metodo, args });
    const c: Record<string, unknown> = {
      upsert: vi.fn((...a: unknown[]) => {
        registrar('upsert', a);
        return Promise.resolve({ data: null, error: null });
      }),
      select: vi.fn((...a: unknown[]) => {
        registrar('select', a);
        return c;
      }),
      delete: vi.fn((...a: unknown[]) => {
        registrar('delete', a);
        return c;
      }),
      insert: vi.fn((...a: unknown[]) => {
        registrar('insert', a);
        return Promise.resolve({ data: null, error: null });
      }),
      eq: vi.fn((...a: unknown[]) => {
        registrar('eq', a);
        return c;
      }),
      order: vi.fn((...a: unknown[]) => {
        registrar('order', a);
        if (tabela === 'push_subscriptions') {
          return Promise.resolve({
            data: subscriptions.map((s) => ({ id: s.id, user_agent: 'Mozilla/5.0', criado_em: '2026-08-01' })),
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: (resolve: (v: unknown) => void) => {
        // Encadeamentos que terminam em .eq(...).eq(...) sem .select/.order
        // explícito (ex.: delete().eq().eq()) resolvem como uma Promise direta.
        resolve({ data: subscriptions, error: null });
      },
    };
    return c;
  }

  const from = vi.fn((tabela: string) => construtor(tabela));
  const getUser = vi.fn(async () => ({ data: { user: opts.usuaria === undefined ? { id: USUARIA_ID } : opts.usuaria } }));

  return { from, auth: { getUser }, chamadas };
}

/** O client admin (service role) usado só para o envio de teste em si e o registro em push_envios — separado do client de sessão da própria usuária. */
function criarSupabaseAdminFake() {
  const chamadas: Chamada[] = [];
  const from = vi.fn((tabela: string) => ({
    insert: vi.fn((...a: unknown[]) => {
      chamadas.push({ tabela, metodo: 'insert', args: a });
      return Promise.resolve({ data: null, error: null });
    }),
  }));
  return { from, chamadas };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(enviarParaSubscricoes).mockReset();
});

describe('ações de notificações — exigem sessão válida', () => {
  it('salvarPreferenciasNotificacao rejeita sem usuária autenticada, sem tocar no banco', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await salvarPreferenciasNotificacao({ lembreteCheckin: false });

    expect(resultado.erro).toBeDefined();
    expect(fake.from).not.toHaveBeenCalled();
  });

  it('pausarNotificacoes rejeita sem sessão', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await pausarNotificacoes(7);

    expect(resultado.erro).toBeDefined();
    expect(resultado.pausadaAte).toBeUndefined();
  });

  it('reativarNotificacoes rejeita sem sessão', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await reativarNotificacoes();

    expect(resultado.erro).toBeDefined();
  });

  it('listarDispositivos retorna lista vazia (não lança) sem sessão', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const dispositivos = await listarDispositivos();

    expect(dispositivos).toEqual([]);
  });

  it('removerDispositivo rejeita sem sessão', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await removerDispositivo('dev-1');

    expect(resultado.erro).toBeDefined();
  });

  it('enviarNotificacaoTeste rejeita sem sessão, sem chamar o admin client', async () => {
    const fake = criarSupabaseFake({ usuaria: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarNotificacaoTeste();

    expect(resultado.erro).toBeDefined();
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});

describe('pausarNotificacoes', () => {
  it('calcula pausada_ate como N dias corridos a partir de agora e grava para a própria usuária', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await pausarNotificacoes(7);

    expect(resultado.erro).toBeUndefined();
    expect(resultado.pausadaAte).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const upsert = fake.chamadas.find((c) => c.metodo === 'upsert');
    const payload = upsert!.args[0] as { usuaria_id: string; pausada_ate: string };
    expect(payload.usuaria_id).toBe(USUARIA_ID);
    expect(payload.pausada_ate).toBe(resultado.pausadaAte);
  });
});

describe('removerDispositivo', () => {
  it('filtra por id E usuaria_id — nunca deixa remover o dispositivo de outra pessoa só sabendo o id', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await removerDispositivo('dev-de-outra-pessoa');

    const eqsDoDelete = fake.chamadas.filter((c) => c.metodo === 'eq');
    const chaves = eqsDoDelete.map((c) => c.args[0]);
    expect(chaves).toContain('id');
    expect(chaves).toContain('usuaria_id');
    const eqUsuaria = eqsDoDelete.find((c) => c.args[0] === 'usuaria_id');
    expect(eqUsuaria!.args[1]).toBe(USUARIA_ID);
  });
});

describe('enviarNotificacaoTeste', () => {
  it('sem nenhum dispositivo inscrito: erro claro, nunca chama enviarParaSubscricoes', async () => {
    const fake = criarSupabaseFake({ subscriptions: [] });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake() as never);

    const resultado = await enviarNotificacaoTeste();

    expect(resultado.erro).toBeDefined();
    expect(enviarParaSubscricoes).not.toHaveBeenCalled();
  });

  it('ambiente sem VAPID configurado (admin client indisponível): erro claro em vez de lançar', async () => {
    const fake = criarSupabaseFake({ subscriptions: [{ id: 's1', endpoint: 'https://x', p256dh: 'a', auth: 'b' }] });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(null as never);

    const resultado = await enviarNotificacaoTeste();

    expect(resultado.erro).toBeDefined();
    expect(enviarParaSubscricoes).not.toHaveBeenCalled();
  });

  it('com dispositivo(s) inscritos: envia e registra em push_envios com tipo "teste"', async () => {
    const fake = criarSupabaseFake({ subscriptions: [{ id: 's1', endpoint: 'https://x', p256dh: 'a', auth: 'b' }] });
    const admin = criarSupabaseAdminFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);
    vi.mocked(enviarParaSubscricoes).mockResolvedValue({ enviados: 1, falhas: 0 });

    const resultado = await enviarNotificacaoTeste();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.enviados).toBe(1);
    expect(enviarParaSubscricoes).toHaveBeenCalledWith(
      admin,
      expect.arrayContaining([expect.objectContaining({ id: 's1' })]),
      expect.objectContaining({ title: 'Rose', tag: 'rose-teste' })
    );

    const registroEnvio = admin.chamadas.find((c) => c.tabela === 'push_envios' && c.metodo === 'insert');
    expect(registroEnvio).toBeDefined();
    expect((registroEnvio!.args[0] as { tipo: string; usuaria_id: string }).tipo).toBe('teste');
    expect((registroEnvio!.args[0] as { tipo: string; usuaria_id: string }).usuaria_id).toBe(USUARIA_ID);
  });

  it('quando o envio de fato falha (0 entregues), reporta erro em vez de sucesso falso', async () => {
    const fake = criarSupabaseFake({ subscriptions: [{ id: 's1', endpoint: 'https://x', p256dh: 'a', auth: 'b' }] });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake() as never);
    vi.mocked(enviarParaSubscricoes).mockResolvedValue({ enviados: 0, falhas: 1 });

    const resultado = await enviarNotificacaoTeste();

    expect(resultado.erro).toBeDefined();
  });
});
