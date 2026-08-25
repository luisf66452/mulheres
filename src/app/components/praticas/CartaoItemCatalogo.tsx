import Link from 'next/link';

import type { ItemCatalogoPratica } from '@/lib/praticas-catalogo/tipos';
import IconeRespiracao from './icones/IconeRespiracao';
import IconeDiario from './icones/IconeDiario';
import IconeMeditacao from './icones/IconeMeditacao';
import IconeAutocompaixao from './icones/IconeAutocompaixao';
import IconeOndaSonora from './icones/IconeOndaSonora';

// Mesmo mapeamento categoria → ícone/cor que CartaoPraticaRapida usava para
// as 4 categorias de práticas rápidas (ver git history de
// src/app/components/praticas/CartaoPraticaRapida.tsx), agora reaplicado
// aqui para que o catálogo unificado (rápidas + áudio do banco) mantenha a
// mesma identidade visual por categoria. Categorias do banco sem ícone
// específico (ex.: "aterramento") caem no fallback de onda sonora — todo
// item desse catálogo tem áudio guiado, então é um fallback sensato.
const ICONES: Record<string, typeof IconeRespiracao> = {
  respiracao: IconeRespiracao,
  diario: IconeDiario,
  meditacao: IconeMeditacao,
  autocompaixao: IconeAutocompaixao,
};

const CORES: Record<string, { fundo: string; circulo: string; capsula: string }> = {
  respiracao: { fundo: 'bg-salvia-suave', circulo: 'bg-salvia', capsula: 'bg-salvia/25' },
  diario: { fundo: 'bg-pessego-suave', circulo: 'bg-pessego', capsula: 'bg-pessego/25' },
  meditacao: { fundo: 'bg-lilas-suave', circulo: 'bg-destaque', capsula: 'bg-destaque/25' },
  autocompaixao: { fundo: 'bg-creme-rosado', circulo: 'bg-acao', capsula: 'bg-acao/15' },
};

const CORES_FALLBACK = { fundo: 'bg-fundo', circulo: 'bg-texto-suave', capsula: 'bg-borda/40' };

export default function CartaoItemCatalogo({ item }: { item: ItemCatalogoPratica }) {
  const Icone = ICONES[item.categoria] ?? IconeOndaSonora;
  const cores = CORES[item.categoria] ?? CORES_FALLBACK;

  return (
    <Link
      href={item.href}
      aria-label={
        item.temAudio
          ? `${item.titulo}, ${item.duracaoLabel}, com áudio guiado. ${item.descricaoCurta}`
          : `${item.titulo}, ${item.duracaoLabel}. ${item.descricaoCurta}`
      }
      className={`flex items-center gap-3 rounded-[28px] border border-borda/50 ${cores.fundo} px-4 py-3.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${cores.circulo}`}>
        <Icone className="text-fundo" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-texto">{item.titulo}</span>
        <span className="block truncate text-sm text-texto-suave">{item.descricaoCurta}</span>
        {item.temAudio && (
          <span className="mt-1 inline-block rounded-full bg-destaque/25 px-2 py-0.5 text-xs font-medium text-texto">
            Áudio guiado
          </span>
        )}
      </span>
      <span className={`shrink-0 rounded-full ${cores.capsula} px-2.5 py-1 text-xs font-medium text-texto`}>
        {item.duracaoLabel}
      </span>
    </Link>
  );
}
