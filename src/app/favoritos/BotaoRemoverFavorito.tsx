'use client';

import { useState, useTransition } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
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
      } catch (error) {
        // Deixa erros internos do Next.js (ex.: redirect('/login') quando a
        // sessão expirou) propagarem para o framework tratar — mesmo padrão
        // usado em BotaoFavorito, nunca engolir o sinal de redirect.
        unstable_rethrow(error);

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
