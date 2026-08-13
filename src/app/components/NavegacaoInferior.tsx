'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconeProps = { ativo: boolean };

function IconeInicio({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconeJornada({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20c3-8 3-12 7-16 4 4 4 8 7 16" />
      <path d="M9.5 13.5h5" />
    </svg>
  );
}

function IconePraticas({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4.5h9a3 3 0 0 1 3 3V19a2.5 2.5 0 0 0-2.5-2.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5Z" />
      <path d="M6 16.5V19" />
    </svg>
  );
}

function IconeProgresso({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-6" />
    </svg>
  );
}

function IconePerfil({ ativo }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={ativo ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5" />
    </svg>
  );
}

const ITENS = [
  { href: '/', rotulo: 'Início', Icone: IconeInicio, prefixosAtivos: ['/'] },
  { href: '/jornadas', rotulo: 'Jornadas', Icone: IconeJornada, prefixosAtivos: ['/jornadas'] },
  { href: '/praticas', rotulo: 'Práticas', Icone: IconePraticas, prefixosAtivos: ['/praticas'] },
  { href: '/progresso', rotulo: 'Progresso', Icone: IconeProgresso, prefixosAtivos: ['/progresso'] },
  { href: '/perfil', rotulo: 'Perfil', Icone: IconePerfil, prefixosAtivos: ['/perfil'] },
] as const;

export default function NavegacaoInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITENS.map(({ href, rotulo, Icone, prefixosAtivos }) => {
          const ativo =
            href === '/'
              ? pathname === '/'
              : prefixosAtivos.some((prefixo) => pathname.startsWith(prefixo));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  ativo ? 'text-acao' : 'text-texto-suave'
                }`}
              >
                <Icone ativo={ativo} />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
