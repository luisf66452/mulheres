'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarConsentimento(): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({ consentimento_dados_sensiveis_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[registrarConsentimento] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { erro: 'Não foi possível registrar seu consentimento. Tente novamente.' };
  }

  redirect('/checkin');
}
