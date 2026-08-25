// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportarMeusDados, enviarConfirmacaoExclusao } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';
import type { PacoteExportado } from '@/lib/exportacao/coletarDados';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/exportacao/coletarDados', () => ({
  coletarDadosExportaveis: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['origin', 'https://rose.exemplo.com']])),
}));

type Usuaria = { id: string; email: string; created_at: string } | null;

function criarSupabaseFake(user: Usuaria) {
  const getUser = vi.fn(async (): Promise<{ data: { user: Usuaria } }> => ({ data: { user } }));
  const signInWithOtp = vi.fn(async (): Promise<{ error: { code?: string; message: string } | null }> => ({
    error: null,
  }));
  return { auth: { getUser, signInWithOtp } };
}

function criarPacoteFake(): PacoteExportado {
  return {
    exportado_em: '2026-08-24T10:00:00.000Z',
    conta: { id: 'usuaria-própria-123', email: 'ana@exemplo.com', criado_em: '2026-01-01T00:00:00Z' },
    perfil: { nome: 'Ana', plano: 'free', pais: 'BR', frase_pessoal: null, faixa_etaria: null, fuso_horario: 'America/Sao_Paulo', idioma: 'pt-BR', foto_url: null, horario_preferido_notificacao: null, assinatura_status: null, assinatura_periodo_fim: null, criado_em: '2026-01-01T00:00:00Z' },
    checkins: [{ id: 'chk-1' } as never],
    jornadas: [],
    jornada_respostas_modulo: [],
    praticas: { sessoes: [], praticas_avulsas_concluidas: [], sessoes_jornadas_conteudo_progresso: [] },
    favoritos: [],
    petalas: { saldo: 120, transacoes: [] },
    recompensas: { resgates: [], desafios_semanais_concluidos: [] },
    notificacoes: null,
    intencao_pagamento: [],
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(coletarDadosExportaveis).mockReset();
});

describe('exportarMeusDados', () => {
  it('delega a coleta de dados ao módulo canônico, passando a usuária da sessão', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ pacote: criarPacoteFake() });

    const resultado = await exportarMeusDados();

    expect(coletarDadosExportaveis).toHaveBeenCalledWith(
      fake,
      expect.objectContaining({ id: 'usuaria-própria-123', email: 'ana@exemplo.com' })
    );
    expect(resultado.erro).toBeUndefined();
    const pacote = JSON.parse(resultado.dados as string);
    expect(pacote.petalas.saldo).toBe(120);
    expect(pacote.checkins).toHaveLength(1);
  });

  it('retorna o erro do módulo canônico sem inventar outra mensagem', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    vi.mocked(coletarDadosExportaveis).mockResolvedValue({ erro: 'Não foi possível preparar seus dados agora. Tente novamente.' });

    const resultado = await exportarMeusDados();

    expect(resultado.erro).toBe('Não foi possível preparar seus dados agora. Tente novamente.');
    expect(resultado.dados).toBeUndefined();
  });

  it('redireciona para /login quando não há usuária autenticada, sem chamar o módulo canônico', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(exportarMeusDados()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(coletarDadosExportaveis).not.toHaveBeenCalled();
  });
});

describe('enviarConfirmacaoExclusao', () => {
  it('envia o link de confirmação para o e-mail da própria usuária autenticada', async () => {
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBeUndefined();
    expect(resultado.emailEnviado).toBe('ana@exemplo.com');
    expect(fake.auth.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@exemplo.com' }));
  });

  it('retorna erro genérico quando o Supabase falha ao enviar o e-mail', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = criarSupabaseFake({ id: 'usuaria-própria-123', email: 'ana@exemplo.com', created_at: '2026-01-01T00:00:00Z' });
    fake.auth.signInWithOtp.mockResolvedValue({ error: { code: '500', message: 'smtp indisponível' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await enviarConfirmacaoExclusao();

    expect(resultado.erro).toBe('Não foi possível enviar o link de confirmação. Tente novamente.');
    expect(resultado.emailEnviado).toBeUndefined();
    spyConsole.mockRestore();
  });
});
