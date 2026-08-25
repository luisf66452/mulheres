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

  // Metadado (título/categoria/status/is_pro) vem sempre de praticas_catalogo
  // — essa view devolve a linha mesmo para uma prática Pro vista por uma
  // usuária free (mesmo padrão de src/app/favoritos/page.tsx), porque a RLS
  // da tabela base (ver migração 20260825060150_praticas_rls_is_pro.sql)
  // agora nega a linha inteira nesse caso. Se buscássemos direto na tabela
  // base primeiro, uma prática Pro pra usuária free retornaria 0 linhas e
  // cairíamos erroneamente em notFound() em vez do paywall.
  const { data: praticaCatalogo } = await supabase
    .from('praticas_catalogo')
    .select('id, categoria, tipo, titulo, status, audio_status, is_pro, criado_em')
    .eq('id', id)
    .eq('status', 'publicada')
    .single();

  if (!praticaCatalogo) {
    notFound();
  }

  // Checagem sempre server-side: uma usuária sem sessão nunca deve ver
  // conteúdo Pro, e o cliente nunca é a fonte de verdade sobre o plano.
  let plano: 'free' | 'premium' = 'free';
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();
    plano = perfil?.plano ?? 'free';
  }

  if (praticaCatalogo.is_pro && plano !== 'premium') {
    return <PaywallPratica titulo={praticaCatalogo.titulo} categoria={praticaCatalogo.categoria} />;
  }

  // Prática não-Pro, ou usuária premium: a RLS da tabela base libera a linha
  // completa (incluindo `conteudo`) normalmente nesse caso.
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
