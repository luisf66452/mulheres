// @vitest-environment node
// src/lib/exportacao/coletarDados.test.ts
import { describe, it, expect, vi } from 'vitest';
import { coletarDadosExportaveis } from './coletarDados';

type ResultadoFake = { data: unknown; error: { code?: string; message: string } | null };

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
    jornada_respostas_modulo: { data: [{ id: 'resp-1', user_id: USUARIA_ID }], error: null },
    conclusoes_praticas_conteudo: { data: [], error: null },
    sessoes_jornadas_conteudo_progresso: { data: [{ id: 'prog-1', usuaria_id: USUARIA_ID }], error: null },
    favoritos: { data: [{ id: 'fav-1', usuaria_id: USUARIA_ID }], error: null },
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

  return { from, chamadasEq };
}

const USUARIA = { id: USUARIA_ID, email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' };

describe('coletarDadosExportaveis', () => {
  it('busca todas as tabelas filtrando só pela própria usuária, incluindo jornada_respostas_modulo por user_id', async () => {
    const fake = criarSupabaseFake();

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.erro).toBeUndefined();
    expect(resultado.pacote).toBeDefined();

    for (const chamada of fake.chamadasEq) {
      if (chamada.coluna === 'usuaria_id' || chamada.coluna === 'user_id' || chamada.coluna === 'id') {
        expect(chamada.valor).toBe(USUARIA_ID);
        expect(chamada.valor).not.toBe(OUTRA_USUARIA_ID);
      }
    }

    const chamadaRespostasModulo = fake.chamadasEq.find((c) => c.tabela === 'jornada_respostas_modulo');
    expect(chamadaRespostasModulo?.coluna).toBe('user_id');
  });

  it('inclui as três tabelas novas (jornada_respostas_modulo, sessoes_jornadas_conteudo_progresso, favoritos) no pacote', async () => {
    const fake = criarSupabaseFake();
    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.pacote?.jornada_respostas_modulo).toHaveLength(1);
    expect(resultado.pacote?.praticas.sessoes_jornadas_conteudo_progresso).toHaveLength(1);
    expect(resultado.pacote?.favoritos).toHaveLength(1);
  });

  it('produz um pacote estruturado por categorias, com o essencial do perfil', async () => {
    const fake = criarSupabaseFake();
    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const pacote = resultado.pacote!;

    expect(pacote.exportado_em).toBeDefined();
    expect(pacote.conta).toEqual(USUARIA);
    expect(pacote.perfil?.nome).toBe('Ana');
    expect(pacote.checkins).toHaveLength(1);
    expect(pacote.petalas.saldo).toBe(120);
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

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const textoExportado = JSON.stringify(resultado.pacote);

    expect(textoExportado).not.toContain('cus_super_secreto');
    expect(textoExportado).not.toContain('sub_super_secreto');
    expect(textoExportado.toLowerCase()).not.toContain('service_role');
    expect(textoExportado).not.toContain('"role"');
  });

  it('isola dados entre usuárias: dados de B nunca aparecem no pacote de A, em nenhuma das tabelas novas', async () => {
    const fake = criarSupabaseFake({
      jornada_respostas_modulo: { data: [{ id: 'resp-A', user_id: USUARIA_ID }], error: null },
      sessoes_jornadas_conteudo_progresso: { data: [{ id: 'prog-A', usuaria_id: USUARIA_ID }], error: null },
      favoritos: { data: [{ id: 'fav-A', usuaria_id: USUARIA_ID }], error: null },
    });

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);
    const textoExportado = JSON.stringify(resultado.pacote);

    expect(textoExportado).not.toContain(OUTRA_USUARIA_ID);
    expect(textoExportado).toContain('resp-A');
    expect(textoExportado).toContain('prog-A');
    expect(textoExportado).toContain('fav-A');
  });

  it('retorna erro genérico e não quebra quando alguma consulta falha', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({
      favoritos: { data: null, error: { code: '42501', message: 'permission denied' } },
    });

    const resultado = await coletarDadosExportaveis(fake as never, USUARIA);

    expect(resultado.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
    expect(resultado.pacote).toBeUndefined();
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
