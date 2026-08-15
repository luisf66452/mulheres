import Link from 'next/link';
import { exigirAdmin } from '@/lib/admin/auth';

// Sem NavegacaoInferior aqui de propósito: a área administrativa não faz
// parte da navegação principal de 5 seções da usuária comum — só quem tem
// perfis.role = 'admin' chega até aqui, e exigirAdmin() barra qualquer
// outra pessoa no servidor, não só escondendo o link.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();

  return (
    <div className="min-h-screen bg-fundo">
      <header className="border-b border-borda bg-superficie px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/admin/resgates" className="font-display text-lg text-texto">
            Painel administrativo · Rose
          </Link>
          <nav className="flex gap-4 text-sm text-texto-suave">
            <Link href="/admin/resgates" className="hover:text-texto">
              Resgates
            </Link>
            <Link href="/admin/recompensas" className="hover:text-texto">
              Catálogo
            </Link>
            <Link href="/" className="hover:text-texto">
              Voltar ao app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-6">{children}</main>
    </div>
  );
}
