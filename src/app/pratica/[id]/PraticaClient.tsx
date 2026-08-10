'use client';

import { useState } from 'react';
import { registrarSessao } from './actions';
import type { Pratica } from '@/lib/supabase/types';

const ESCALA = [1, 2, 3, 4, 5];

export default function PraticaClient({
  pratica,
  checkinId,
}: {
  pratica: Pratica;
  checkinId: string;
}) {
  const [etapa, setEtapa] = useState<'antes' | 'pratica' | 'depois'>('antes');
  const [sensacaoAntes, setSensacaoAntes] = useState<number | null>(null);
  const [sensacaoDepois, setSensacaoDepois] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (etapa === 'antes') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <p>Antes de começar, como você está se sentindo agora?</p>
        <Escala valor={sensacaoAntes} onChange={setSensacaoAntes} />
        <button
          disabled={sensacaoAntes === null}
          onClick={() => setEtapa('pratica')}
          className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
        >
          Continuar
        </button>
      </main>
    );
  }

  if (etapa === 'pratica') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-2xl font-semibold">{pratica.titulo}</h1>
        <p className="whitespace-pre-line">{pratica.conteudo}</p>
        <button
          onClick={() => setEtapa('depois')}
          className="w-full rounded bg-black p-3 text-white"
        >
          Concluí a prática
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <p>Como você se sente agora?</p>
      <Escala valor={sensacaoDepois} onChange={setSensacaoDepois} />
      <button
        disabled={sensacaoDepois === null || enviando}
        onClick={async () => {
          setEnviando(true);
          await registrarSessao({
            checkinId,
            praticaId: pratica.id,
            sensacaoAntes: sensacaoAntes!,
            sensacaoDepois: sensacaoDepois!,
          });
        }}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        Finalizar
      </button>
    </main>
  );
}

function Escala({ valor, onChange }: { valor: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {ESCALA.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-12 w-12 rounded-full border ${valor === n ? 'bg-black text-white' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
