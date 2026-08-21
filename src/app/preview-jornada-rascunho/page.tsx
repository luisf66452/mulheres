import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { estaEmPreviewVercel } from '@/lib/supabase/previewOnly';
import PreviewJornadaRascunhoClient from './PreviewJornadaRascunhoClient';

// Força avaliação por requisição — nunca prerenderizar estaticamente esta
// página, já que tanto a checagem de VERCEL_ENV quanto a de sessão precisam
// rodar a cada acesso, não uma vez em build time.
export const dynamic = 'force-dynamic';

// Existe só para permitir testar, em deployments de Preview da Vercel, o
// conteúdo em rascunho (aguardando validação da psicóloga) antes de
// publicar. `estaEmPreviewVercel()` lê VERCEL_ENV, que a própria Vercel
// define por deployment e nenhuma requisição consegue alterar — em
// Production este componente sempre devolve 404, com ou sem sessão.
export default async function PreviewJornadaRascunhoPage() {
  if (!estaEmPreviewVercel()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <PreviewJornadaRascunhoClient />;
}
