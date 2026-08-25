import Link from 'next/link';

import type { ItemCatalogoPratica } from '@/lib/praticas-catalogo/tipos';

export default function CartaoItemCatalogo({ item }: { item: ItemCatalogoPratica }) {
  return (
    <Link
      href={item.href}
      aria-label={`${item.titulo}, ${item.duracaoLabel}. ${item.descricaoCurta}`}
      className="flex items-center gap-3 rounded-[28px] border border-borda/50 bg-superficie px-4 py-3.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-texto">{item.titulo}</span>
        <span className="block truncate text-sm text-texto-suave">{item.descricaoCurta}</span>
        {item.temAudio && (
          <span className="mt-1 inline-block rounded-full bg-destaque/25 px-2 py-0.5 text-xs font-medium text-texto">
            Áudio guiado
          </span>
        )}
      </span>
      <span className="shrink-0 rounded-full bg-borda/40 px-2.5 py-1 text-xs font-medium text-texto">
        {item.duracaoLabel}
      </span>
    </Link>
  );
}
