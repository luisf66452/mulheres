import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inscreverPush } from './subscribe';

describe('inscreverPush', () => {
  const registerMock = vi.fn().mockResolvedValue(undefined);
  const requestPermissionMock = vi.fn().mockResolvedValue('granted');

  beforeEach(() => {
    registerMock.mockClear();
    requestPermissionMock.mockClear();

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        ready: Promise.resolve({
          pushManager: {
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({ endpoint: 'https://exemplo.com', keys: { p256dh: 'a', auth: 'b' } }),
            }),
          },
        }),
      },
    });

    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { requestPermission: requestPermissionMock },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('nao registra o service worker fora de producao (evita brigar com o Fast Refresh do next dev)', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const resultado = await inscreverPush();

    expect(resultado).toBe('nao_suportado');
    expect(registerMock).not.toHaveBeenCalled();
    expect(requestPermissionMock).not.toHaveBeenCalled();
  });

  it('registra o service worker e se inscreve em producao quando a permissao e concedida', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const resultado = await inscreverPush();

    expect(resultado).toBe('inscrita');
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it('retorna negado quando a permissao nao e concedida, sem registrar o sw', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    requestPermissionMock.mockResolvedValueOnce('denied');

    const resultado = await inscreverPush();

    expect(resultado).toBe('negado');
    expect(registerMock).not.toHaveBeenCalled();
  });
});
