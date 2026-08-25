// @vitest-environment node
// src/app/api/exportar/[formato]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';
import type { PacoteExportado } from '@/lib/exportacao/coletarDados';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/exportacao/coletarDados', () => ({
  coletarDadosExportaveis: vi.fn(),
}));

const USUARIA_ID = 'sessao-usuaria-abc';

function criarPacoteFake(overrides: Partial<PacoteExportado> = {}): PacoteExportado {
  return {
    exportado_em: '2026-08-24T10:00:00.000Z',
    conta: { id: USUARIA_ID, email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' },
    perfil: null,
    checkins: [{ id: 'chk-1', usuaria_id: USUARIA_ID, texto_livre: '=PERIGO()' } as never],
    jornadas: [],
    jornada_respostas_modulo: [],
    praticas: { sessoes: [], praticas_avulsas_concluidas: [], sessoes_jornadas_conteudo_progresso: [] },
    favoritos: [{ id: 'fav-1', usuaria_id: USUARIA_ID, pratica_id: 'prat-1', sessao_id: null, criado_em: '2026-01-01T00:00:00Z' }],
    petalas: { saldo: 0, transacoes: [] },
    recompensas: { resgates: [], desafios_semanais_concluidos: [] },
    notificacoes: null,
    intencao_pagamento: [],
    ...overrides,
  };
}

function criarSupabaseServerFake(opts: { user: { id: string; email: string; created_at: string } | null }) {
  return { auth: { getUser: vi.fn(async () => ({ data: { user: opts.user } })) } };
}

function criarSupabaseAdminFake() {
  const insert = vi.fn(async () => ({ error: null }));
  return {
    from: vi.fn(() => ({ insert })),
    __mocks: { insert },
  };
}

function requisicao(formato: string) {
  return { request: new NextRequest(`https://rose.exemplo.com/api/exportar/${formato}`), params: Promise.resolve({ formato }) };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(coletarDadosExportaveis).mockReset();
});

describe('GET /api/exportar/[formato]', () => {
  it('recusa sem sessão autenticada', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ user: null }) as never);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(401);
  });

  it('recusa formato inválido antes de consultar qualquer dado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    const { request, params } = requisicao('xml');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(400);
    expect(coletarDadosExportaveis).not.toHaveBeenCalled();
  });

  it('responde JSON com headers corretos (Content-Type, Content-Disposition com data, Cache-Control)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/json');
    expect(resposta.headers.get('cache-control')).toBe('private, no-store');
    expect(resposta.headers.get('content-disposition')).toMatch(
      /^attachment; filename="rose-meus-dados-\d{4}-\d{2}-\d{2}\.json"$/
    );

    const corpo = await resposta.json();
    expect(corpo.conta.id).toBe(USUARIA_ID);
  });

  it('responde ZIP (CSV) com Content-Type application/zip e extensão .zip no nome do arquivo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('csv');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/zip');
    expect(resposta.headers.get('content-disposition')).toMatch(
      /^attachment; filename="rose-meus-dados-\d{4}-\d{2}-\d{2}\.zip"$/
    );
  });

  it('o ZIP contém exatamente os 5 CSVs esperados, e o texto de check-in perigoso vem escapado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(criarSupabaseAdminFake() as never);
    const { request, params } = requisicao('csv');

    const resposta = await GET(request, { params });
    const bytes = new Uint8Array(await resposta.arrayBuffer());

    const decoder = new TextDecoder();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const nomes: string[] = [];
    let conteudoCheckins = '';
    let cursor = 0;
    while (cursor < bytes.length && view.getUint32(cursor, true) === 0x04034b50) {
      const tamanhoComprimido = view.getUint32(cursor + 18, true);
      const tamanhoNome = view.getUint16(cursor + 26, true);
      const inicioNome = cursor + 30;
      const nome = decoder.decode(bytes.slice(inicioNome, inicioNome + tamanhoNome));
      const inicioConteudo = inicioNome + tamanhoNome;
      if (nome === 'checkins.csv') {
        conteudoCheckins = decoder.decode(bytes.slice(inicioConteudo, inicioConteudo + tamanhoComprimido));
      }
      nomes.push(nome);
      cursor = inicioConteudo + tamanhoComprimido;
    }

    expect(nomes).toEqual(['checkins.csv', 'reflexoes.csv', 'praticas.csv', 'jornadas.csv', 'favoritos.csv']);
    expect(conteudoCheckins).toContain("'=PERIGO()");
    expect(conteudoCheckins).not.toMatch(/,=PERIGO\(\)/); // nunca sem o prefixo de escape
  });

  it('registra a exportação em exportacoes_dados via admin client, só com usuaria_id e tipo', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    const adminFake = criarSupabaseAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const { request, params } = requisicao('json');

    await GET(request, { params });

    expect(adminFake.from).toHaveBeenCalledWith('exportacoes_dados');
    expect(adminFake.__mocks.insert).toHaveBeenCalledWith({ usuaria_id: USUARIA_ID, tipo: 'json' });
  });

  it('devolve o arquivo mesmo se o registro de auditoria falhar (best-effort, nunca bloqueia o download)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(null);
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });

    expect(resposta.status).toBe(200);
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('retorna 500 sem vazar detalhe interno quando a coleta de dados falha', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID, email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' } }) as never
    );
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ erro: 'Não foi possível preparar seus dados agora. Tente novamente.' });
    const { request, params } = requisicao('json');

    const resposta = await GET(request, { params });
    const corpo = await resposta.json();

    expect(resposta.status).toBe(500);
    expect(corpo.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
  });
});
