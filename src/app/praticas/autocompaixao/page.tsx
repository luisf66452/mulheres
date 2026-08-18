import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoPratica from '@/app/components/praticas/CabecalhoPratica';
import { obterPraticaPorId } from '@/lib/praticas-conteudo/dados';
import AutocompaixaoClient from './AutocompaixaoClient';

export default async function AutocompaixaoPage() {
  const pratica = obterPraticaPorId('autocompaixao');
  if (!pratica) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoPratica pratica={pratica} />
      <AutocompaixaoClient pratica={pratica} usuariaId={user.id} />
      <NavegacaoInferior />
    </main>
  );
}
