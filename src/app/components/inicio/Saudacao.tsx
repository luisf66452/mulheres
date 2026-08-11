'use client';

import { useState } from 'react';

function saudacaoPorHorario(hora: number): string {
  if (hora < 5) return 'Boa noite';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// O horário do servidor não é o horário local da usuária, então o
// cumprimento certo só existe no cliente — o servidor renderiza um valor
// neutro e o suppressHydrationWarning evita o aviso da divergência esperada.
export default function Saudacao() {
  const [saudacao] = useState(() =>
    typeof window === 'undefined' ? 'Olá' : saudacaoPorHorario(new Date().getHours())
  );

  return (
    <p className="font-display text-2xl text-texto" suppressHydrationWarning>
      {saudacao}
    </p>
  );
}
