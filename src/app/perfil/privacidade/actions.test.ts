// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportarMeusDados, enviarConfirmacaoExclusao } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['origin', 'https://rose.exemplo.com']])),
}));

type ResultadoFake = { data: unknown; error: { code?: string; message: string } | null };
type Usuaria = { id: string; email: string; created_at: string } | null;

function criarConstrutor(tabela: string, resultado: ResultadoFake, chamadasEq: Array<{ tabela: string; coluna: string; valor: unknown }>) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn((coluna: string, valor: unknown) => {
      chamadasEq.push({ tabela, coluna, valor });
      return construtor;
    }),
    single: vi.fn(async () => resultado),
    maybeSingle: vi.fn(async () => resultado),
    then: (resolve: (v: ResultadoFake) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return construtor;
}

const USUARIA_ID = 'usuaria-própria-123';
const OUTRA_USUARIA_ID = 'usuaria-outra-999';

function criarSupabaseFake(overrides: Partial<Record<string, ResultadoFake>> = {}) {
  const tabelas: Record<string, ResultadoFake> = {
    perfis: { data: { id: USUARIA_ID, nome: 'Ana', plano: 'free', criado_em: '2026-01-01T00:00:00Z' }, error: null },
    checkins: { data: [{ id: 'chk-1', usuaria_id: USUARIA_ID }], error: null },
    sessoes: { data: [{ id: 'ses-1', usuaria_id: USUARIA_ID }], error: null },
    jornadas_usuarias: { data: [{ id: 'jor-1', usuaria_id: USUARIA_ID }], error: null },
    conclusoes_praticas_conteudo: { data: [], error: null },
    carteiras_petalas: { data: { usuaria_id: USUARIA_ID, saldo: 120 }, error: null },
    transacoes_petalas: { data: [{ id: 'tx-1', usuaria_id: USUARIA_ID }], error: null },
    resgates_desafio_semanal: { data: [], error: null },
    resgates_recompensas: { data: [], error: null },
    preferencias_notificacoes: { data: { usuaria_id: USUARIA_ID, lembrete_checkin: true }, error: null },
    intencao_pagamento: { data: [], error: null },
    ...overrides,
  };

  const chamadasEq: Array<{ tabela: string; coluna: string; valor: unknown }> = [];

  const from = vi.fn((tabela: string) => {
    const resultado = tabelas[tabela];
    if (!resultado) throw new Error(`tabela inesperada em teste: ${tabela}`);
    return criarConstrutor(tabela, resultado, chamadasEq);
  });

  const getUser = vi.fn(async (): Promise<{ data: { user: Usuaria } }> => ({
    data: { user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } },
  }));

  const signInWithOtp = vi.fn(async (): Promise<{ error: { code?: string; message: string } | null }> => ({
    error: null,
  }));

  return {
    from,
    auth: { getUser, signInWithOtp },
    chamadasEq,
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
});

describe('exportarMeusDados', () => {
  it('busca e retorna só os dados da própria usuária autenticada, filtrando por seu id em toda tabela', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await exportarMeusDados();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.dados).toBeDefined();

    for (const chamada of fake.chamadasEq) {
      if (chamada.coluna === 'usuaria_id' || chamada.coluna === 'id') {
        expect(chamada.valor).toBe(USUARIA_ID);
        expect(chamada.valor).not.toBe(OUTRA_USUARIA_ID);
      }
    }
  });

  it('produz um JSON estruturado por categorias, com o essencial do perfil', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await exportarMeusDados();
    const pacote = JSON.parse(resultado.dados as string);

    expect(pacote).toHaveProperty('exportado_em');
    expect(pacote).toHaveProperty('conta');
    expect(pacote).toHaveProperty('perfil');
    expect(pacote).toHaveProperty('checkins');
    expect(pacote).toHaveProperty('jornadas');
    expect(pacote).toHaveProperty('praticas');
    expect(pacote).toHaveProperty('petalas');
    expect(pacote).toHaveProperty('recompensas');
    expect(pacote.petalas.saldo).toBe(120);
    expect(pacote.checkins).toHaveLength(1);
  });

  it('não inclui segredos, tokens, service role ou identificadores internos do Stripe', async () => {
    const fake = criarSupabaseFake({
      perfis: {
        data: {
          id: USUARIA_ID,
          nome: 'Ana',
          plano: 'premium',
          criado_em: '2026-01-01T00:00:00Z',
          stripe_customer_id: 'cus_super_secreto',
          stripe_subscription_id: 'sub_super_secreto',
          role: 'usuaria',
        },
        error: null,
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await exportarMeusDados();
    const textoExportado = resultado.dados as string;

    expect(textoExportado).not.toContain('cus_super_secreto');
    expect(textoExportado).not.toContain('sub_super_secreto');
    expect(textoExportado.toLowerCase()).not.toContain('service_role');
    expect(textoExportado.toLowerCase()).not.toContain('token');
  });

  it('retorna erro genérico e não quebra quando alguma consulta falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({
      checkins: { data: null, error: { code: '42501', message: 'permission denied' } },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await exportarMeusDados();

    expect(resultado.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
    expect(resultado.dados).toBeUndefined();
    expect(spyConsole).toHaveBeenCalled();
    const [, detalhes] = spyConsole.mock.calls[0];
    expect(JSON.stringify(detalhes)).not.toMatch(/@exemplo\.com/);
    spyConsole.mockRestore();
  });

  it('redireciona para /login quando não há usuária autenticada', async () => {
    const fake = criarSupabaseFake();
    fake.auth.getUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(exportarMeusDados()).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});

describe('enviarConfirmacaoExclusao', () => {
  it('envia o link de confirmação para o e-mail da própria usuária autenticada', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.emailEnviado).toBe('ana@exemplo.com');
    expect(fake.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@exemplo.com' })
    );
  });

  it('retorna erro genérico quando o Supabase falha ao enviar o e-mail', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake();
    fake.auth.signInWithOtp.mockResolvedValue({ error: { code: '500', message: 'smtp indisponível' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBe('Não foi possível enviar o link de confirmação. Tente novamente.');
    expect(resultado.emailEnviado).toBeUndefined();
    spyConsole.mockRestore();
  });
});
