import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePwaInstall } from './usePwaInstall';

function dispararBeforeInstallPrompt() {
  const evento = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  evento.prompt = vi.fn().mockResolvedValue(undefined);
  evento.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(evento);
  return evento;
}

describe('usePwaInstall', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.__rosePwaInstallEvent = null;
  });

  it('usa o evento guardado em window.__rosePwaInstallEvent quando beforeinstallprompt disparou antes da montagem', () => {
    const evento = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    evento.prompt = vi.fn().mockResolvedValue(undefined);
    evento.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.__rosePwaInstallEvent = evento;

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.podeInstalar).toBe(true);
  });

  it('comeca sem prompt de instalacao disponivel', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.podeInstalar).toBe(false);
  });

  it('fica instalavel apos beforeinstallprompt e chama prompt() ao instalar', async () => {
    const { result } = renderHook(() => usePwaInstall());
    let evento: ReturnType<typeof dispararBeforeInstallPrompt>;

    act(() => {
      evento = dispararBeforeInstallPrompt();
    });

    expect(result.current.podeInstalar).toBe(true);

    await act(async () => {
      await result.current.instalar();
    });

    expect(evento!.prompt).toHaveBeenCalledOnce();
  });

  it('detecta modo standalone via matchMedia', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.ehStandalone).toBe(true);
  });

  it('dispensar() persiste em localStorage e reflete no proximo render', () => {
    const { result, rerender } = renderHook(() => usePwaInstall());

    act(() => {
      result.current.dispensar();
    });
    rerender();

    expect(result.current.foiDispensado).toBe(true);
    expect(window.localStorage.getItem('rose-pwa-dispensado')).toBe('1');
  });

  it('evento appinstalled limpa o prompt e ativa standalone', () => {
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      dispararBeforeInstallPrompt();
    });

    expect(result.current.podeInstalar).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.podeInstalar).toBe(false);
    expect(result.current.ehStandalone).toBe(true);
  });

  it('detecta iOS classico via userAgent (iPhone)', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.ehIOS).toBe(true);
  });

  it('detecta iPadOS via platform MacIntel com touch', () => {
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.ehIOS).toBe(true);
  });

  it('nao detecta iOS em navegador desktop', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'Win32',
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.ehIOS).toBe(false);
  });
});
