// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

const USUARIA_ID = 'sessao-usuaria-abc';
const ID_INJETADO_PELO_CLIENT = 'outra-usuaria-maliciosa-xyz';

function criarSupabaseServerFake(opts: { user: { id: string } | null }) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: opts.user } })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
}

function criarPerfilConstrutor(perfil: { stripe_subscription_id: string | null; assinatura_status: string | null } | null) {
  const construtor = {
    select: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    maybeSingle: vi.fn(async () => ({ data: perfil, error: null })),
  };
  return construtor;
}

function criarSupabaseAdminFake(opts: {
  perfil?: { stripe_subscription_id: string | null; assinatura_status: string | null } | null;
  arquivosAvatar?: Array<{ name: string }>;
  erroDeleteUser?: { code?: string; message: string } | null;
}) {
  const remove = vi.fn(async () => ({ error: null }));
  const list = vi.fn(async () => ({ data: opts.arquivosAvatar ?? [], error: null }));
  const deleteUser = vi.fn(async () => ({ error: opts.erroDeleteUser ?? null }));

  return {
    from: vi.fn((tabela: string) => {
      if (tabela === 'perfis') return criarPerfilConstrutor(opts.perfil ?? null);
      throw new Error(`tabela inesperada em teste: ${tabela}`);
    }),
    storage: {
      from: vi.fn(() => ({ list, remove })),
    },
    auth: {
      admin: { deleteUser },
    },
    __mocks: { remove, list, deleteUser },
  };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseAdminClient).mockReset();
  vi.mocked(obterStripe).mockReset();
});

describe('POST /api/perfil/excluir-conta', () => {
  it('recusa sem sessão autenticada, sem tentar excluir nada', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(criarSupabaseServerFake({ user: null }) as never);
    const adminFake = criarSupabaseAdminFake({});
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(401);
    expect(corpo.erro).toBeDefined();
    expect(adminFake.__mocks.deleteUser).not.toHaveBeenCalled();
  });

  it('retorna 501 quando a service role não está configurada neste ambiente', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID } }) as never
    );
    vi.mocked(createSupabaseAdminClient).mockReturnValue(null);

    const resposta = await POST();
    expect(resposta.status).toBe(501);
  });

  it('exclui sempre pelo id da sessão do servidor, nunca por um id vindo do client', async () => {
    const serverFake = criarSupabaseServerFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake({ perfil: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    await POST();

    expect(adminFake.__mocks.deleteUser).toHaveBeenCalledWith(USUARIA_ID);
    expect(adminFake.__mocks.deleteUser).not.toHaveBeenCalledWith(ID_INJETADO_PELO_CLIENT);
  });

  it('cancela a assinatura Stripe ativa antes de excluir a conta', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID } }) as never
    );
    const adminFake = criarSupabaseAdminFake({
      perfil: { stripe_subscription_id: 'sub_123', assinatura_status: 'active' },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const cancel = vi.fn(async () => ({}));
    vi.mocked(obterStripe).mockReturnValue({ subscriptions: { cancel } } as never);

    const resposta = await POST();

    expect(cancel).toHaveBeenCalledWith('sub_123');
    expect(resposta.status).toBe(200);
  });

  it('segue com a exclusão mesmo se o cancelamento no Stripe falhar', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID } }) as never
    );
    const adminFake = criarSupabaseAdminFake({
      perfil: { stripe_subscription_id: 'sub_123', assinatura_status: 'active' },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);
    const cancel = vi.fn(async () => {
      throw new Error('stripe indisponível');
    });
    vi.mocked(obterStripe).mockReturnValue({ subscriptions: { cancel } } as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.sucesso).toBe(true);
    expect(adminFake.__mocks.deleteUser).toHaveBeenCalledWith(USUARIA_ID);
    spyConsole.mockRestore();
  });

  it('remove os arquivos de avatar da usuária no Storage', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      criarSupabaseServerFake({ user: { id: USUARIA_ID } }) as never
    );
    const adminFake = criarSupabaseAdminFake({
      perfil: null,
      arquivosAvatar: [{ name: 'foto.png' }],
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    await POST();

    expect(adminFake.__mocks.list).toHaveBeenCalledWith(USUARIA_ID);
    expect(adminFake.__mocks.remove).toHaveBeenCalledWith([`${USUARIA_ID}/foto.png`]);
  });

  it('encerra a sessão só depois que a exclusão é concluída com sucesso', async () => {
    const serverFake = criarSupabaseServerFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake({ perfil: null });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(corpo.sucesso).toBe(true);
    expect(serverFake.auth.signOut).toHaveBeenCalled();
  });

  it('não encerra a sessão nem apaga nada quando a exclusão falha, e não vaza detalhes do erro', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverFake = criarSupabaseServerFake({ user: { id: USUARIA_ID } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(serverFake as never);
    const adminFake = criarSupabaseAdminFake({
      perfil: null,
      erroDeleteUser: { code: 'unexpected_failure', message: 'detalhe interno sensível do banco' },
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminFake as never);

    const resposta = await POST();
    const corpo = await resposta.json();

    expect(resposta.status).toBe(500);
    expect(corpo.erro).not.toContain('detalhe interno sensível do banco');
    expect(serverFake.auth.signOut).not.toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
