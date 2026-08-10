'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function registrarIntencaoPagamento(planoEscolhido: string, precoHipotetico: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('intencao_pagamento').insert({
    usuaria_id: user.id,
    plano_escolhido: planoEscolhido,
    preco_hipotetico: precoHipotetico,
  });
}
