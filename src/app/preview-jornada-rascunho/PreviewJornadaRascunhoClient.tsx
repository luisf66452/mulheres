'use client';

import { useState, useTransition } from 'react';
import { ativarJornadaRascunhoPreview } from './actions';
import Botao from '@/app/components/Botao';

export default function PreviewJornadaRascunhoClient() {
  const [erro, setErro] = useState<string | null>(null);
  const [ativando, startTransition] = useTransition();

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2 rounded-2xl border border-alerta bg-alerta/10 p-4">
        <p className="font-medium text-texto">Ambiente de teste (Preview)</p>
        <p className="text-texto-suave">
          Esta página só existe neste deployment de Preview e não está disponível em produção. Ela
          inscreve sua conta na jornada &ldquo;Fundamentos emocionais&rdquo; (9 módulos), que ainda
          está em rascunho e aguardando validação da psicóloga — usuárias reais não têm acesso a ela.
        </p>
      </div>

      {erro && <p className="text-alerta">{erro}</p>}

      <Botao
        disabled={ativando}
        onClick={() => {
          setErro(null);
          startTransition(async () => {
            const resultado = await ativarJornadaRascunhoPreview();
            if (resultado?.erro) {
              setErro(resultado.erro);
            }
          });
        }}
      >
        {ativando ? 'Ativando...' : 'Ativar jornada de teste e ir para o check-in'}
      </Botao>
    </main>
  );
}
