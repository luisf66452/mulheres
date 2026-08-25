'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { favoritar, desfavoritar, type TipoFavorito } from '@/app/favoritos/actions';

export default function BotaoFavorito({
  tipo,
  id,
  favoritadoInicial,
  className = '',
}: {
  tipo: TipoFavorito;
  id: string;
  favoritadoInicial: boolean;
  className?: string;
}) {
  const [favoritado, setFavoritado] = useState(favoritadoInicial);
  const [pendente, startTransition] = useTransition();

  function alternar(evento: MouseEvent<HTMLButtonElement>) {
    // Este botão frequentemente vive dentro (ou ao lado, sobre um link
    // "stretched") de um Cartao clicável — nunca deixa o clique navegar.
    evento.preventDefault();
    evento.stopPropagation();

    const proximoValor = !favoritado;
    setFavoritado(proximoValor);

    startTransition(async () => {
      try {
        if (proximoValor) {
          await favoritar(tipo, id);
        } else {
          await desfavoritar(tipo, id);
        }
      } catch (error) {
        // Deixa erros internos do Next.js (ex.: redirect('/login') quando a
        // sessão expirou) propagarem para o framework tratar — nunca reverte
        // a UI otimista nesse caso, a usuária está mesmo sendo redirecionada.
        unstable_rethrow(error);

        // Reverte a UI otimista se a action falhar de verdade (rede, RLS,
        // validação de servidor) — nunca deixa o botão "mentir" sobre o
        // estado real.
        setFavoritado(!proximoValor);
      }
    });
  }

  return (
    <button
      type="button"
      aria-pressed={favoritado}
      aria-label={favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={alternar}
      disabled={pendente}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:opacity-60 ${
        favoritado ? 'text-acao' : 'text-texto-suave hover:text-acao'
      } ${className}`}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={favoritado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path
          d="M12 21s-7.5-4.7-10-9.3C.4 8.1 2 4 6 4c2 0 3.6 1.1 4.5 2.6C11.4 5.1 13 4 15 4c4 0 5.6 4.1 4 7.7-2.5 4.6-10 9.3-10 9.3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
