import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import NotificacoesForm from './NotificacoesForm';

export default async function NotificacoesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('horario_preferido_notificacao')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Notificações" subtitulo="Escolha quando e como quer ser lembrada" />
      <NotificacoesForm usuariaId={user.id} horarioAtual={perfil?.horario_preferido_notificacao ?? null} />
      <NavegacaoInferior />
    </main>
  );
}
