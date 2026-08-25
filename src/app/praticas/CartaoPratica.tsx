import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BotaoFavorito from '@/app/components/favoritos/BotaoFavorito';
import type { Pratica } from '@/lib/supabase/types';

export default function CartaoPratica({ pratica, favoritado }: { pratica: Pratica; favoritado: boolean }) {
  return (
    <Cartao className="relative flex items-start justify-between gap-3 transition-colors hover:bg-fundo">
      <Link
        href={`/praticas/${pratica.id}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <span className="sr-only">{pratica.titulo}</span>
      </Link>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-base text-texto">{pratica.titulo}</p>
        <p className="line-clamp-2 text-sm text-texto-suave">{pratica.conteudo}</p>
      </div>
      <BotaoFavorito tipo="pratica" id={pratica.id} favoritadoInicial={favoritado} className="relative z-10" />
    </Cartao>
  );
}
