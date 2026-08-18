'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ExcluirDefinitivamenteBotao() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [excluindo, startTransition] = useTransition();

  function handleExcluir() {
    setErro(null);
    startTransition(async () => {
      const resposta = await fetch('/api/perfil/excluir-conta', { method: 'POST' });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.erro ?? 'Não foi possível excluir sua conta agora. Nada foi apagado.');
        return;
      }

      setConcluido(true);
      setTimeout(() => router.replace('/login?conta_excluida=1'), 2000);
    });
  }

  if (concluido) {
    return (
      <p role="status" className="text-sm text-texto">
        Sua conta foi excluída. Encerrando sua sessão...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
      <button
        type="button"
        onClick={handleExcluir}
        disabled={excluindo}
        className="w-full rounded-2xl bg-alerta p-3 text-center font-medium text-white transition-colors hover:bg-alerta/90 disabled:opacity-40 disabled:pointer-events-none"
      >
        {excluindo ? 'Excluindo...' : 'Excluir minha conta definitivamente'}
      </button>
    </div>
  );
}
