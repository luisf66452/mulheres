import Link from 'next/link';
import type { ComponentType } from 'react';
import IconeSeta from './icones/IconeSeta';

export default function CartaoMenuPerfil({
  href,
  rotulo,
  Icone,
}: {
  href: string;
  rotulo: string;
  Icone: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-borda/60 bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)] transition-colors hover:bg-fundo active:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lilas-claro text-acao">
        <Icone className="h-5 w-5" />
      </span>
      <span className="flex-1 text-texto">{rotulo}</span>
      <IconeSeta className="shrink-0 text-texto-suave" />
    </Link>
  );
}
