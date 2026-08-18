import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import ConfiguracoesForm from './ConfiguracoesForm';
import { version } from '../../../../package.json';

export default async function ConfiguracoesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error } = await supabase
    .from('perfis')
    .select('fuso_horario')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Configurações" subtitulo="Ajustes do app e do dispositivo" />

      {error ? (
        <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
          Não foi possível carregar suas configurações de conta agora. Tente novamente em instantes.
        </div>
      ) : (
        <ConfiguracoesForm
          usuariaId={user.id}
          fusoHorarioAtual={perfil?.fuso_horario ?? 'America/Sao_Paulo'}
          versaoApp={version}
        />
      )}

      <NavegacaoInferior />
    </main>
  );
}
