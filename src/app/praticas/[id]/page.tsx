import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import PaywallPratica from './PaywallPratica';

export default async function PraticaBibliotecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pratica } = await supabase
    .from('praticas')
    .select('*')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!pratica) {
    notFound();
  }

  // Checagem sempre server-side: uma usuária sem sessão nunca deve ver
  // conteúdo Pro, e o cliente nunca é a fonte de verdade sobre o plano.
  let plano: 'free' | 'premium' = 'free';
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();
    plano = perfil?.plano ?? 'free';
  }

  if (pratica.is_pro && plano !== 'premium') {
    return <PaywallPratica titulo={pratica.titulo} categoria={pratica.categoria} />;
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
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
