'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ATRASO_GRAVACAO_MS = 400;

export function usePersistedState<T>(
  chave: string,
  valorInicial: T
): [T, (valor: T) => void, () => void] {
  const [valor, setValorState] = useState<T>(() => {
    if (typeof window === 'undefined') return valorInicial;
    try {
      const bruto = window.localStorage.getItem(chave);
      return bruto !== null ? (JSON.parse(bruto) as T) : valorInicial;
    } catch {
      return valorInicial;
    }
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const definir = useCallback(
    (novoValor: T) => {
      setValorState(novoValor);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          window.localStorage.setItem(chave, JSON.stringify(novoValor));
        } catch {
          // localStorage indisponível (ex.: modo privado) — segue só em memória
        }
      }, ATRASO_GRAVACAO_MS);
    },
    [chave]
  );

  const limpar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      window.localStorage.removeItem(chave);
    } catch {
      // ignora
    }
    setValorState(valorInicial);
    // valorInicial é intencionalmente omitido das deps: é o valor "de fábrica"
    // passado na primeira chamada do hook, não deve mudar entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return [valor, definir, limpar];
}
