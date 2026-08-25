'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { desfavoritar, type TipoFavorito } from './actions';

export default function BotaoRemoverFavorito({ tipo, id }: { tipo: TipoFavorito; id: string }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState(false);

  function remover() {
    setErro(false);
    startTransition(async () => {
      try {
        await desfavoritar(tipo, id);
        router.refresh();
      } catch {
        setErro(true);
      }
    });
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={remover}
        disabled={pendente}
        className="text-xs font-medium text-texto-suave underline-offset-2 hover:text-alerta hover:underline disabled:opacity-60"
      >
        {pendente ? 'Removendo...' : 'Remover'}
      </button>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-alerta">
          Não foi possível remover.
        </p>
      )}
    </div>
  );
}
