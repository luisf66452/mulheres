import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import PreferenciasForm from './PreferenciasForm';

export default async function PreferenciasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Preferências" subtitulo="O que mais importa para você aqui" />
      <PreferenciasForm usuariaId={user.id} />
      <NavegacaoInferior />
    </main>
  );
}
