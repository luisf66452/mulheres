'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Cartao from '@/app/components/Cartao';

type Humor = 1 | 2 | 3 | 4 | 5;

const NIVEIS: { valor: Humor; rotulo: string; cor: string; curvaBoca: string }[] = [
  { valor: 1, rotulo: 'Muito bem', cor: 'var(--color-humor-1)', curvaBoca: 'M13 23 Q20 30 27 23' },
  { valor: 2, rotulo: 'Bem', cor: 'var(--color-humor-2)', curvaBoca: 'M14 24 Q20 28 26 24' },
  { valor: 3, rotulo: 'Neutro', cor: 'var(--color-humor-3)', curvaBoca: 'M14 26 H26' },
  { valor: 4, rotulo: 'Mal', cor: 'var(--color-humor-4)', curvaBoca: 'M14 27 Q20 23 26 27' },
  { valor: 5, rotulo: 'Muito mal', cor: 'var(--color-humor-5)', curvaBoca: 'M13 28 Q20 21 27 28' },
];

function CarinhaHumor({ cor, curvaBoca }: { cor: string; curvaBoca: string }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={cor} />
      <circle cx="14" cy="17" r="1.8" fill="#fff" fillOpacity="0.9" />
      <circle cx="26" cy="17" r="1.8" fill="#fff" fillOpacity="0.9" />
      <path d={curvaBoca} stroke="#fff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function SeletorHumor() {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<Humor | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function selecionar(valor: Humor) {
    if (pendingTimeoutRef.current !== null) {
      clearTimeout(pendingTimeoutRef.current);
    }
    setSelecionado(valor);
    pendingTimeoutRef.current = setTimeout(() => router.push(`/checkin?humor=${valor}`), 180);
  }

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current !== null) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Cartao className="space-y-4 text-center">
      <p className="font-display text-lg text-texto">
        Como você está
        <br />
        se sentindo hoje?
      </p>
      <div className="flex justify-between gap-1">
        {NIVEIS.map((nivel) => (
          <button
            key={nivel.valor}
            type="button"
            onClick={() => selecionar(nivel.valor)}
            aria-label={nivel.rotulo}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
              selecionado === nivel.valor
                ? 'scale-110 ring-2 ring-acao ring-offset-2 ring-offset-superficie'
                : ''
            }`}
          >
            <CarinhaHumor cor={nivel.cor} curvaBoca={nivel.curvaBoca} />
            <span className="text-[11px] leading-tight text-texto-suave">{nivel.rotulo}</span>
          </button>
        ))}
      </div>
    </Cartao>
  );
}
