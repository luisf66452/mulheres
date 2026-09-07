// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enviarEmailAcessoAssinatura } from './assinatura';
import { obterResend } from './client';

vi.mock('./client', () => ({
  obterResend: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(obterResend).mockReset();
});

describe('enviarEmailAcessoAssinatura', () => {
  it('envia o e-mail com o link de acesso e retorna true', async () => {
    const send = vi.fn(async () => ({ data: { id: 'email-1' }, error: null }));
    vi.mocked(obterResend).mockReturnValue({ emails: { send } } as never);

    const resultado = await enviarEmailAcessoAssinatura(
      'cliente@exemplo.com',
      'https://app.exemplo.com/auth/callback?token=abc'
    );

    expect(resultado).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente@exemplo.com',
        subject: expect.any(String),
        html: expect.stringContaining('https://app.exemplo.com/auth/callback?token=abc'),
      })
    );
  });

  it('retorna false e loga quando o Resend não está configurado', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(obterResend).mockReturnValue(null);

    const resultado = await enviarEmailAcessoAssinatura('cliente@exemplo.com', 'https://app.exemplo.com/link');

    expect(resultado).toBe(false);
    spyConsole.mockRestore();
  });

  it('retorna false e loga quando o Resend retorna erro', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const send = vi.fn(async () => ({ data: null, error: { message: 'falha simulada' } }));
    vi.mocked(obterResend).mockReturnValue({ emails: { send } } as never);

    const resultado = await enviarEmailAcessoAssinatura('cliente@exemplo.com', 'https://app.exemplo.com/link');

    expect(resultado).toBe(false);
    spyConsole.mockRestore();
  });
});
