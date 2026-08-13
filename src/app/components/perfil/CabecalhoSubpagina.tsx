import Link from 'next/link';
import IconeVoltar from '@/app/components/praticas/icones/IconeVoltar';

export default function CabecalhoSubpagina({
  titulo,
  subtitulo,
  voltarHref = '/perfil',
}: {
  titulo: string;
  subtitulo?: string;
  voltarHref?: string;
}) {
  return (
    <header className="space-y-3">
      <Link
        href={voltarHref}
        aria-label="Voltar para o Perfil"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borda/60 text-texto transition-colors hover:bg-superficie focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <IconeVoltar />
      </Link>
      <div>
        <h1 className="font-display text-2xl text-texto">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-texto-suave">{subtitulo}</p>}
      </div>
    </header>
  );
}
