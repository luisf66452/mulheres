'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCronometro = 'parado' | 'executando' | 'pausado' | 'concluido';

export interface CronometroRegressivo {
  segundosRestantes: number;
  segundosDecorridos: number;
  estado: EstadoCronometro;
  iniciar: () => void;
  pausar: () => void;
  continuar: () => void;
  reiniciar: () => void;
}

export function useCronometroRegressivo(
  duracaoTotalS: number,
  aoConcluir?: () => void
): CronometroRegressivo {
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const [estado, setEstado] = useState<EstadoCronometro>('parado');
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aoConcluirRef = useRef(aoConcluir);

  useEffect(() => {
    aoConcluirRef.current = aoConcluir;
  }, [aoConcluir]);

  const pararIntervalo = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, []);

  useEffect(() => pararIntervalo, [pararIntervalo]);

  const iniciarIntervalo = useCallback(() => {
    pararIntervalo();
    intervaloRef.current = setInterval(() => {
      setSegundosDecorridos((atual) => {
        const proximo = atual + 1;
        if (proximo >= duracaoTotalS) {
          pararIntervalo();
          setEstado('concluido');
          aoConcluirRef.current?.();
          return duracaoTotalS;
        }
        return proximo;
      });
    }, 1000);
  }, [duracaoTotalS, pararIntervalo]);

  const iniciar = useCallback(() => {
    setSegundosDecorridos(0);
    setEstado('executando');
    iniciarIntervalo();
  }, [iniciarIntervalo]);

  const pausar = useCallback(() => {
    pararIntervalo();
    setEstado('pausado');
  }, [pararIntervalo]);

  const continuar = useCallback(() => {
    setEstado('executando');
    iniciarIntervalo();
  }, [iniciarIntervalo]);

  const reiniciar = useCallback(() => {
    pararIntervalo();
    setSegundosDecorridos(0);
    setEstado('parado');
  }, [pararIntervalo]);

  return {
    segundosRestantes: Math.max(duracaoTotalS - segundosDecorridos, 0),
    segundosDecorridos,
    estado,
    iniciar,
    pausar,
    continuar,
    reiniciar,
  };
}
