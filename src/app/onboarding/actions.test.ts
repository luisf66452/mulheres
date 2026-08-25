// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  confirmarPais,
  salvarObjetivos,
  salvarTemasSensiveis,
  concluirPersonalizacao,
  dispensarPersonalizacao,
} from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/perfil/nome', () => ({ normalizarNome: (n: string) => n }));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((rota: string) => {
    throw new Error(`NEXT_REDIRECT:${rota}`);
  }),
}));

const USUARIA_ID = 'usuaria-propria-123';

function criarSupabaseFake(perfilAtual: { pais_confirmado_em: string | null } | null) {
  const eq = vi.fn().mockReturnThis();
  const single = vi.fn(async () => ({ data: perfilAtual, error: null }));
  const select = vi.fn(() => ({ eq, single }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn(async (): Promise<{ data: { user: { id: string } | null } }> => ({
    data: { user: { id: USUARIA_ID } },
  }));
  return { from, auth: { getUser } };
}

function criarAdminFake() {
  const eq = vi.fn(async () => ({ error: null }));
  const update = vi.fn((payload: Record<string, unknown>) => {
    void payload;
    return { eq };
  });
  const from = vi.fn(() => ({ update }));
  return { from, update, eq };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
});

describe('confirmarPais', () => {
  it('bloqueia (redireciona para /login) sem sessão autenticada', async () => {
    const fake = criarSupabaseFake(null);
    fake.auth.getUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await expect(confirmarPais('PT')).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('rejeita país fora da lista suportada (PT/BR), sem chamar o client admin', async () => {
    const fake = criarSupabaseFake({ pais_confirmado_em: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    const resultado = await confirmarPais('US');

    expect(resultado.erro).toBeDefined();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it("rejeita valores adversariais (ex.: tentativa de injeção/objeto) como país inválido", async () => {
    const fake = criarSupabaseFake({ pais_confirmado_em: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    const resultado = await confirmarPais("PT'; update perfis set role='admin'; --");

    expect(resultado.erro).toBeDefined();
  });

  it('a action não tem parâmetro de user_id — sempre deriva da própria sessão', () => {
    expect(confirmarPais.length).toBe(1);
  });

  it('não sobrescreve uma confirmação já existente — redireciona sem chamar o admin client', async () => {
    const fake = criarSupabaseFake({ pais_confirmado_em: '2026-01-01T00:00:00Z' });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    await expect(confirmarPais('BR')).rejects.toThrow('NEXT_REDIRECT:/');
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it('em confirmação legítima, escreve só {pais, pais_confirmado_em} e NÃO redireciona mais — quem decide o próximo passo é o client', async () => {
    const fake = criarSupabaseFake({ pais_confirmado_em: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    const resultado = await confirmarPais('PT');

    expect(resultado).toEqual({});
    expect(admin.update).toHaveBeenCalledTimes(1);
    const payload = admin.update.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['pais', 'pais_confirmado_em'].sort());
    expect(payload.pais).toBe('PT');
    expect('plano' in payload).toBe(false);
    expect('role' in payload).toBe(false);
  });

  it('a atualização é sempre filtrada pelo id da própria usuária autenticada', async () => {
    const fake = criarSupabaseFake({ pais_confirmado_em: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await confirmarPais('BR');

    expect(admin.eq).toHaveBeenCalled();
  });
});

describe('salvarObjetivos', () => {
  it('rejeita objetivo fora da lista fechada, sem chamar o admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    const resultado = await salvarObjetivos(['objetivo-inventado']);

    expect(resultado.erro).toBeDefined();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it('grava array vazio quando o sentinela "decidir_depois" foi escolhido', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarObjetivos(['fortalecer_autoestima', 'decidir_depois']);

    expect(admin.update).toHaveBeenCalledWith({ objetivos: [] });
  });

  it('grava a seleção normalizada quando válida', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    const resultado = await salvarObjetivos(['fortalecer_autoestima', 'criar_ritual_diario']);

    expect(resultado).toEqual({});
    expect(admin.update).toHaveBeenCalledWith({ objetivos: ['fortalecer_autoestima', 'criar_ritual_diario'] });
    expect(admin.eq).toHaveBeenCalledWith('id', USUARIA_ID);
  });
});

describe('salvarTemasSensiveis', () => {
  it('rejeita tema fora da lista fechada, sem chamar o admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const adminSpy = vi.mocked(createSupabaseAdminClient);

    const resultado = await salvarTemasSensiveis(['tema-inventado']);

    expect(resultado.erro).toBeDefined();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it('grava array vazio quando "prefiro_nao_responder" foi escolhido', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarTemasSensiveis(['prefiro_nao_responder']);

    expect(admin.update).toHaveBeenCalledWith({ temas_sensiveis: [] });
  });

  it('mantém "nenhum_desses" no array gravado — não é sentinela de pular', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await salvarTemasSensiveis(['nenhum_desses']);

    expect(admin.update).toHaveBeenCalledWith({ temas_sensiveis: ['nenhum_desses'] });
  });
});

describe('concluirPersonalizacao', () => {
  it('sem horário: não toca preferencias/horario, só marca onboarding_extra_concluido_em e redireciona', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await expect(concluirPersonalizacao(null)).rejects.toThrow('NEXT_REDIRECT:/?cadastro=concluido');

    expect(fake.from).not.toHaveBeenCalledWith('perfis'); // nenhum update via client autenticado
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_extra_concluido_em: expect.any(String) })
    );
  });

  it('com horário: grava horario_preferido_notificacao pelo client autenticado (sem admin) e depois marca conclusão', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const getUser = vi.fn(async () => ({ data: { user: { id: USUARIA_ID } } }));
    const fakeAutenticado = { from, auth: { getUser } };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fakeAutenticado as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    await expect(concluirPersonalizacao('08:00')).rejects.toThrow('NEXT_REDIRECT:/?cadastro=concluido');

    expect(update).toHaveBeenCalledWith({ horario_preferido_notificacao: '08:00' });
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_extra_concluido_em: expect.any(String) })
    );
  });
});

describe('dispensarPersonalizacao', () => {
  it('grava só onboarding_extra_dispensado_em via admin client', async () => {
    const fake = criarSupabaseFake(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);
    const admin = criarAdminFake();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(admin as never);

    const resultado = await dispensarPersonalizacao();

    expect(resultado).toEqual({});
    const payload = admin.update.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(['onboarding_extra_dispensado_em']);
  });
});
