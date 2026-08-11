'use client';

import { useState, useTransition } from 'react';
import { registrarConsentimento } from './actions';

export default function OnboardingPage() {
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento();
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Antes de começar</h1>
      <p>
        Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional.
        Ele te ajuda a construir um pequeno ritual diário de cuidado com você mesma.
      </p>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={aceitouTermos}
          onChange={(e) => setAceitouTermos(e.target.checked)}
          className="mt-1"
        />
        <span>
          Li e aceito os <a href="/privacidade" className="underline">Termos de Uso e a Política de Privacidade</a>.
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={aceitouDadosSensiveis}
          onChange={(e) => setAceitouDadosSensiveis(e.target.checked)}
          className="mt-1"
        />
        <span>
          Entendo que este app coleta dados sensíveis sobre humor, imagem corporal e alimentação,
          e autorizo esse tratamento para receber o ritual diário personalizado.
        </span>
      </label>

      {erro && <p className="text-red-600">{erro}</p>}

      <button
        disabled={!podeContinuar || enviando}
        onClick={handleContinuar}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        {enviando ? 'Enviando...' : 'Continuar'}
      </button>
    </main>
  );
}
