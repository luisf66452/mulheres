'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarConsentimento() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await supabase
    .from('perfis')
    .update({ consentimento_dados_sensiveis_em: new Date().toISOString() })
    .eq('id', user.id);

  redirect('/checkin');
}
