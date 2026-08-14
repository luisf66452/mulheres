'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ATRASO_GRAVACAO_MS = 400;

export function usePersistedState<T>(
  chave: string,
  valorInicial: T
): [T, (valor: T) => void, () => void] {
  // O estado sempre nasce com `valorInicial` (idêntico no servidor e no
  // primeiro render do cliente) e só é substituído pelo rascunho salvo
  // dentro de um efeito, que roda depois da hidratação. Ler o
  // localStorage direto no `useState` causaria o servidor renderizar
  // vazio e o cliente hidratar já com o rascunho — um mismatch de
  // hidratação no React.
  const [valor, setValorState] = useState<T>(valorInicial);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sincroniza o estado com o localStorage (sistema externo) assim que o
    // componente monta no cliente — de propósito fora do `useState` inicial,
    // para o primeiro render do cliente bater com o do servidor (ver
    // comentário acima). Não é um espelhamento de prop-em-state comum.
    let bruto: string | null = null;
    try {
      bruto = window.localStorage.getItem(chave);
    } catch {
      bruto = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValorState(bruto !== null ? (JSON.parse(bruto) as T) : valorInicial);
    // valorInicial é intencionalmente omitido das deps: é o valor "de fábrica"
    // passado na primeira chamada do hook, não deve disparar o efeito de novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

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
