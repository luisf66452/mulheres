// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import webpush from 'web-push';
import { enviarParaSubscricoes } from './enviar';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

function criarSupabaseAdminFake() {
  const deleteEq = vi.fn(async () => ({ error: null }));
  const del = vi.fn(() => ({ eq: deleteEq }));
  return { from: vi.fn(() => ({ delete: del })), _deleteEq: deleteEq, _delete: del };
}

const payload = { title: 'Rose', body: 'Corpo', url: '/inicio', tag: 'teste' };

describe('enviarParaSubscricoes', () => {
  beforeEach(() => {
    vi.mocked(webpush.sendNotification).mockReset();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'chave-publica-fake';
    process.env.VAPID_PRIVATE_KEY = 'chave-privada-fake';
  });

  it('conta como enviado quando sendNotification resolve', async () => {
    vi.mocked(webpush.sendNotification).mockResolvedValueOnce({} as never);
    const admin = criarSupabaseAdminFake();

    const resultado = await enviarParaSubscricoes(
      admin as never,
      [{ id: 'sub-1', endpoint: 'https://push.exemplo/1', p256dh: 'a', auth: 'b' }],
      payload
    );

    expect(resultado).toEqual({ enviados: 1, falhas: 0 });
    expect(admin._delete).not.toHaveBeenCalled();
  });

  it('remove a subscription quando o provedor responde 410 (Gone)', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 });
    const admin = criarSupabaseAdminFake();

    const resultado = await enviarParaSubscricoes(
      admin as never,
      [{ id: 'sub-expirada', endpoint: 'https://push.exemplo/2', p256dh: 'a', auth: 'b' }],
      payload
    );

    expect(resultado).toEqual({ enviados: 0, falhas: 1 });
    expect(admin.from).toHaveBeenCalledWith('push_subscriptions');
    expect(admin._deleteEq).toHaveBeenCalledWith('id', 'sub-expirada');
  });

  it('remove a subscription quando o provedor responde 404', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 404 });
    const admin = criarSupabaseAdminFake();

    await enviarParaSubscricoes(admin as never, [{ id: 'sub-x', endpoint: 'e', p256dh: 'a', auth: 'b' }], payload);

    expect(admin._deleteEq).toHaveBeenCalledWith('id', 'sub-x');
  });

  it('NAO remove a subscription em erro transitorio (ex.: 500 do provedor)', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 500 });
    const admin = criarSupabaseAdminFake();

    const resultado = await enviarParaSubscricoes(
      admin as never,
      [{ id: 'sub-y', endpoint: 'e', p256dh: 'a', auth: 'b' }],
      payload
    );

    expect(resultado).toEqual({ enviados: 0, falhas: 1 });
    expect(admin._delete).not.toHaveBeenCalled();
  });

  it('envia para todas as subscriptions da usuaria, mesmo se uma falhar', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 }).mockResolvedValueOnce({} as never);
    const admin = criarSupabaseAdminFake();

    const resultado = await enviarParaSubscricoes(
      admin as never,
      [
        { id: 'sub-1', endpoint: 'e1', p256dh: 'a', auth: 'b' },
        { id: 'sub-2', endpoint: 'e2', p256dh: 'a', auth: 'b' },
      ],
      payload
    );

    expect(resultado).toEqual({ enviados: 1, falhas: 1 });
  });

  it('nunca envia um payload com url absoluta/externa — sempre reescreve para o fallback seguro', async () => {
    vi.mocked(webpush.sendNotification).mockResolvedValueOnce({} as never);
    const admin = criarSupabaseAdminFake();

    await enviarParaSubscricoes(
      admin as never,
      [{ id: 'sub-1', endpoint: 'e1', p256dh: 'a', auth: 'b' }],
      { ...payload, url: 'https://evil.example.com/phish' }
    );

    const corpoEnviado = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string);
    expect(corpoEnviado.url).toBe('/inicio');
  });
});
