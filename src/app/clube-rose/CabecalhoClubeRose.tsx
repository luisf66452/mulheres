import Link from 'next/link';
import IconeVoltar from '@/app/components/praticas/icones/IconeVoltar';
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';

export default function CabecalhoClubeRose({ voltarHref = '/' }: { voltarHref?: string }) {
  return (
    <header className="relative space-y-3 pr-14">
      <Link
        href={voltarHref}
        aria-label="Voltar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borda/60 text-texto transition-colors hover:bg-superficie focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <IconeVoltar />
      </Link>
      <IlustracaoFlorCabecalho className="pointer-events-none absolute -top-1 right-0 h-14 w-14" />
      <div>
        <h1 className="font-display text-3xl text-texto">Clube Rose</h1>
        <p className="mt-1 text-sm text-texto-suave">Seu cuidado também pode florescer.</p>
      </div>
    </header>
  );
}
