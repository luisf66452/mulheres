import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCronometroRegressivo } from './useCronometroRegressivo';

describe('useCronometroRegressivo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('começa parado com todo o tempo restante', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    expect(result.current.estado).toBe('parado');
    expect(result.current.segundosRestantes).toBe(10);
  });

  it('conta regressivamente a cada segundo depois de iniciar', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.segundosRestantes).toBe(7);
    expect(result.current.estado).toBe('executando');
  });

  it('pausa e mantém o tempo restante congelado', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.pausar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.segundosRestantes).toBe(7);
    expect(result.current.estado).toBe('pausado');
  });

  it('continua de onde parou', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.pausar());
    act(() => result.current.continuar());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.segundosRestantes).toBe(5);
  });

  it('reinicia zerando o tempo decorrido', () => {
    const { result } = renderHook(() => useCronometroRegressivo(10));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => result.current.reiniciar());
    expect(result.current.segundosRestantes).toBe(10);
    expect(result.current.estado).toBe('parado');
  });

  it('chama aoConcluir e marca concluído ao chegar no fim', () => {
    const aoConcluir = vi.fn();
    const { result } = renderHook(() => useCronometroRegressivo(3, aoConcluir));
    act(() => result.current.iniciar());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.estado).toBe('concluido');
    expect(result.current.segundosRestantes).toBe(0);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
  });
});
