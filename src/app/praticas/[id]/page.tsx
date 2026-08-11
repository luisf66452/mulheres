import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

export default async function PraticaBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">
        {pratica.categoria}
      </span>
      <h1 className="font-display text-2xl text-texto">{pratica.titulo}</h1>
      <p className="whitespace-pre-line text-texto">{pratica.conteudo}</p>
      <Link
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </Link>
      <NavegacaoInferior />
    </main>
  );
}
