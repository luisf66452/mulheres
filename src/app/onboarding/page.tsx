import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('consentimento_dados_sensiveis_em, pais_confirmado_em, onboarding_extra_concluido_em')
    .eq('id', user.id)
    .single();

  // Já passou por tudo (país confirmado e personalização concluída) — não há
  // mais etapa nenhuma para retomar. Sem este redirect, revisitar /onboarding
  // manualmente re-montaria o wizard do zero para quem já terminou.
  if (perfil?.pais_confirmado_em && perfil?.onboarding_extra_concluido_em) {
    redirect('/');
  }

  return (
    <OnboardingClient
      consentimentoJaRegistrado={Boolean(perfil?.consentimento_dados_sensiveis_em)}
      paisJaConfirmado={Boolean(perfil?.pais_confirmado_em)}
      personalizacaoJaConcluida={Boolean(perfil?.onboarding_extra_concluido_em)}
    />
  );
}
