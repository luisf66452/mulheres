import Link from 'next/link';
import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import IconeVoltar from './icones/IconeVoltar';

export default function CabecalhoPratica({ pratica }: { pratica: PraticaRapida }) {
  return (
    <header className="space-y-3">
      <Link
        href="/praticas"
        aria-label="Voltar para Práticas"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borda/60 text-texto transition-colors hover:bg-superficie focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <IconeVoltar />
      </Link>
      <div>
        <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
        <p className="mt-1 text-sm text-texto-suave">{pratica.descricaoCurta}</p>
      </div>
      <span className="inline-block rounded-full bg-borda/50 px-3 py-1 text-xs font-medium text-texto">
        {pratica.duracaoLabel}
      </span>
    </header>
  );
}
