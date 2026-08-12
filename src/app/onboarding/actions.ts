'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizarNome } from '@/lib/perfil/nome';

export async function registrarConsentimento(nomeBruto?: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({
      consentimento_dados_sensiveis_em: new Date().toISOString(),
      nome: normalizarNome(nomeBruto ?? ''),
    })
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

  redirect('/');
}
