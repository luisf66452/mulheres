import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import PersonalizacaoForm from './PersonalizacaoForm';

export default async function PersonalizacaoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('objetivos, temas_sensiveis, horario_preferido_notificacao')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina
        titulo="Personalize sua experiência"
        subtitulo="Você pode mudar essas respostas quando quiser"
      />
      <PersonalizacaoForm
        objetivosIniciais={perfil?.objetivos ?? []}
        temasIniciais={perfil?.temas_sensiveis ?? []}
        horarioInicial={perfil?.horario_preferido_notificacao ?? null}
      />
      <NavegacaoInferior />
    </main>
  );
}
