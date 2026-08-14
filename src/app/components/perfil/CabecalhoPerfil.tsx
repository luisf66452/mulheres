import Link from 'next/link';
import IlustracaoFlorCabecalho from '@/app/components/jornadas/ilustracoes/IlustracaoFlorCabecalho';
import AvatarPerfil from './AvatarPerfil';

const FRASE_PADRAO = 'Cuidar de mim é a minha escolha.';

export default function CabecalhoPerfil({
  nome,
  frase,
  fotoUrl = null,
}: {
  nome: string | null;
  frase: string | null;
  fotoUrl?: string | null;
}) {
  return (
    <header className="relative overflow-hidden rounded-b-[28px] bg-lilas-claro px-4 pb-7 pt-10">
      <IlustracaoFlorCabecalho className="pointer-events-none absolute right-4 top-4 h-16 w-16" />
      <Link
        href="/perfil/editar"
        aria-label="Editar perfil"
        className="mx-auto flex max-w-[220px] flex-col items-center gap-3 rounded-2xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
      >
        <AvatarPerfil nome={nome} fotoUrl={fotoUrl} />
        <span>
          <span className="block truncate font-display text-2xl text-texto">{nome ?? 'Olá'}</span>
          <span className="mt-1 block text-sm text-texto-suave">{frase ?? FRASE_PADRAO}</span>
        </span>
      </Link>
    </header>
  );
}
