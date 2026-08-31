// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AuthCallbackPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

const getSession = vi.fn();

beforeEach(() => {
  replace.mockClear();
  getSession.mockReset();
  vi.mocked(createSupabaseBrowserClient).mockReturnValue({
    auth: { getSession },
  } as never);
  window.location.hash = '';
});

describe('AuthCallbackPage', () => {
  it('marca o retorno de um login concluído para abrir a oferta pós-login', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/?entrada=1'));
  });

  it('redireciona para o login com erro quando o fragmento traz error_description', async () => {
    window.location.hash = '#error=access_denied&error_description=Link%20expirado';

    render(<AuthCallbackPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/login?erro=' + encodeURIComponent('Link expirado'))
    );
    expect(getSession).not.toHaveBeenCalled();
  });

  it('redireciona para o login quando não há sessão nem erro explícito no fragmento', async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    render(<AuthCallbackPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        '/login?erro=' + encodeURIComponent('Link de acesso inválido ou expirado.')
      )
    );
  });
});
