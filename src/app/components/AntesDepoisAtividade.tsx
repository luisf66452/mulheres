'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';
import Escala from '@/app/components/Escala';

export default function AntesDepoisAtividade({
  titulo,
  conteudo,
  aoFinalizar,
}: {
  titulo: string;
  conteudo: string;
  aoFinalizar: (sensacaoAntes: number, sensacaoDepois: number) => Promise<void>;
}) {
  const [etapa, setEtapa] = useState<'antes' | 'atividade' | 'depois'>('antes');
  const [sensacaoAntes, setSensacaoAntes] = useState<number | null>(null);
  const [sensacaoDepois, setSensacaoDepois] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (etapa === 'antes') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <p className="text-texto">Antes de começar, como você está se sentindo agora?</p>
        <Escala valor={sensacaoAntes} onChange={setSensacaoAntes} />
        <Botao disabled={sensacaoAntes === null} onClick={() => setEtapa('atividade')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'atividade') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">{titulo}</h1>
        <p className="whitespace-pre-line text-texto">{conteudo}</p>
        <Botao onClick={() => setEtapa('depois')}>Concluí a atividade</Botao>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <p className="text-texto">Como você se sente agora?</p>
      <Escala valor={sensacaoDepois} onChange={setSensacaoDepois} />
      <Botao
        disabled={sensacaoDepois === null || enviando}
        onClick={async () => {
          setEnviando(true);
          await aoFinalizar(sensacaoAntes!, sensacaoDepois!);
        }}
      >
        Finalizar
      </Botao>
    </main>
  );
}
