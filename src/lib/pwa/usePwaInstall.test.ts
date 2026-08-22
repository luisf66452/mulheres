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
});
