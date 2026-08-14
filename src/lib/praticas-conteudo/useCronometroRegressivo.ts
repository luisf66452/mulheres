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
  const concluidoChamadoRef = useRef(false);

  // "concluído" é derivado da contagem, não guardado em estado próprio —
  // evita precisar de um setState assim que a contagem bate na duração
  // total (só computa de novo no próximo render, o que já acontece).
  const chegouAoFim = segundosDecorridos >= duracaoTotalS;
  const estadoPublico: EstadoCronometro = chegouAoFim ? 'concluido' : estado;

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
      // O updater fica puro (só calcula o próximo número, sem passar de
      // duracaoTotalS) — parar o intervalo e chamar `aoConcluir` são
      // efeitos colaterais, então vivem no useEffect abaixo, reagindo à
      // contagem ter chegado ao fim. Chamá-los aqui dentro correria o
      // risco de rodar duas vezes: o Strict Mode do React invoca
      // updaters de useState duas vezes em desenvolvimento para
      // flagrar exatamente esse tipo de impureza.
      setSegundosDecorridos((atual) => Math.min(atual + 1, duracaoTotalS));
    }, 1000);
  }, [duracaoTotalS, pararIntervalo]);

  useEffect(() => {
    if (!chegouAoFim) {
      concluidoChamadoRef.current = false;
      return;
    }
    if (concluidoChamadoRef.current) return;
    concluidoChamadoRef.current = true;
    pararIntervalo();
    aoConcluirRef.current?.();
  }, [chegouAoFim, pararIntervalo]);

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
    estado: estadoPublico,
    iniciar,
    pausar,
    continuar,
    reiniciar,
  };
}
