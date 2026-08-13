'use client';

import Link from 'next/link';
import { useState } from 'react';

function saudacaoPorHorario(hora: number): string {
  if (hora < 5) return 'Boa noite';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function IconeSino() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

// O horário do servidor não é o horário local da usuária, então o
// cumprimento certo só existe no cliente — o servidor renderiza um valor
// neutro e o suppressHydrationWarning evita o aviso da divergência esperada.
export default function Saudacao({ nome }: { nome: string | null }) {
  const [saudacao] = useState(() =>
    typeof window === 'undefined' ? 'Olá' : saudacaoPorHorario(new Date().getHours())
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-display text-2xl text-texto" suppressHydrationWarning>
        {saudacao}, {nome ?? 'Sofia'}
      </p>
      <Link
        href="/settings"
        aria-label="Ver lembretes"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-borda bg-superficie text-texto-suave transition-colors hover:bg-fundo"
      >
        <IconeSino />
      </Link>
    </div>
  );
}
