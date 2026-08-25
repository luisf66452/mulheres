// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salvarHorarioPreferido } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

const USUARIA_ID = 'usuaria-propria-123';

function criarSupabaseFake() {
  const eq = vi.fn(async () => ({ error: null }));
  const update = vi.fn((payload: Record<string, unknown>) => {
    void payload;
    return { eq };
  });
  const from = vi.fn(() => ({ update }));
  const getUser = vi.fn(async (): Promise<{ data: { user: { id: string } | null } }> => ({
    data: { user: { id: USUARIA_ID } },
  }));
  return { from, update, eq, auth: { getUser } };
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
});

describe('salvarHorarioPreferido', () => {
  it('grava a string de horário recebida', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await salvarHorarioPreferido('08:30');

    expect(fake.update).toHaveBeenCalledWith({ horario_preferido_notificacao: '08:30' });
    expect(fake.eq).toHaveBeenCalledWith('id', USUARIA_ID);
  });

  it('aceita null e grava null na coluna (limpar a preferência de lembrete)', async () => {
    const fake = criarSupabaseFake();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await salvarHorarioPreferido(null);

    expect(fake.update).toHaveBeenCalledWith({ horario_preferido_notificacao: null });
  });

  it('sem sessão autenticada, não toca no banco', async () => {
    const fake = criarSupabaseFake();
    fake.auth.getUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(fake as never);

    await salvarHorarioPreferido('09:00');

    expect(fake.from).not.toHaveBeenCalled();
  });
});
