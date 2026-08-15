// Error boundary global: Next.js exige que este arquivo seja Client
// Component. Cobre qualquer segmento sem o próprio error.tsx — sem ele, um
// erro não tratado (ex.: throw em uma Server Action) derruba para a tela de
// erro genérica e sem estilo do Next, quebrando a identidade visual do Rose
// justamente no momento em que a usuária mais precisa de acolhimento.
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Botao from '@/app/components/Botao';

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sem dados emocionais/pessoais aqui — só a mensagem técnica do erro, útil
    // para depuração. Ver regra de não misturar dados sensíveis em logs.
    console.error('[ErroGlobal]', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-2xl text-texto">Algo não saiu como esperado</h1>
      <p className="text-texto-suave">
        Não foi possível concluir essa ação agora. Seus dados salvos não foram afetados — pode tentar de
        novo em instantes.
      </p>
      <div className="flex gap-3">
        <Botao variante="secundaria" onClick={() => reset()}>
          Tentar de novo
        </Botao>
        <Link
          href="/"
          className="flex items-center rounded-2xl border border-borda bg-superficie px-4 py-3 text-texto-suave transition-colors hover:bg-superficie/70"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
