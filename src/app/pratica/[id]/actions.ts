'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarSessao(params: {
  checkinId: string;
  praticaId: string;
  sensacaoAntes: number;
  sensacaoDepois: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await supabase.from('sessoes').insert({
    checkin_id: params.checkinId,
    usuaria_id: user.id,
    pratica_id: params.praticaId,
    jornada_atividade_id: null,
    sensacao_antes: params.sensacaoAntes,
    sensacao_depois: params.sensacaoDepois,
  });

  redirect('/progresso');
}
