import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lê o valor inicial do localStorage quando já existe', () => {
    window.localStorage.setItem('chave-teste', JSON.stringify('valor salvo'));
    const { result } = renderHook(() => usePersistedState('chave-teste', 'inicial'));
    expect(result.current[0]).toBe('valor salvo');
  });

  it('usa o valor inicial quando nada está salvo', () => {
    const { result } = renderHook(() => usePersistedState('chave-vazia', 'inicial'));
    expect(result.current[0]).toBe('inicial');
  });

  it('grava no localStorage depois da janela de debounce', () => {
    const { result } = renderHook(() => usePersistedState('chave-debounce', ''));
    act(() => {
      result.current[1]('novo valor');
    });
    expect(window.localStorage.getItem('chave-debounce')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(window.localStorage.getItem('chave-debounce')).toBe(JSON.stringify('novo valor'));
  });

  it('limpa o valor salvo e volta para o valor inicial', () => {
    const { result } = renderHook(() => usePersistedState('chave-limpar', 'inicial'));
    act(() => {
      result.current[1]('outro valor');
      vi.advanceTimersByTime(400);
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe('inicial');
    expect(window.localStorage.getItem('chave-limpar')).toBeNull();
  });

  it('mantém valores de chaves diferentes isolados entre si', () => {
    const { result: a } = renderHook(() => usePersistedState('chave-a', 'a-inicial'));
    const { result: b } = renderHook(() => usePersistedState('chave-b', 'b-inicial'));
    act(() => {
      a.current[1]('a-valor');
      vi.advanceTimersByTime(400);
    });
    expect(window.localStorage.getItem('chave-a')).toBe(JSON.stringify('a-valor'));
    expect(window.localStorage.getItem('chave-b')).toBeNull();
    expect(b.current[0]).toBe('b-inicial');
  });
});
