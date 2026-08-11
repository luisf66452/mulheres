import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import type { Pratica } from '@/lib/supabase/types';

export default function CartaoPratica({ pratica }: { pratica: Pratica }) {
  return (
    <Link href={`/praticas/${pratica.id}`}>
      <Cartao className="space-y-1 transition-colors hover:bg-fundo">
        <p className="font-display text-base text-texto">{pratica.titulo}</p>
        <p className="line-clamp-2 text-sm text-texto-suave">{pratica.conteudo}</p>
      </Cartao>
    </Link>
  );
}
