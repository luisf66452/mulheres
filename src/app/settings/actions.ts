'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function salvarHorarioPreferido(horario: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('perfis')
    .update({ horario_preferido_notificacao: horario })
    .eq('id', user.id);
}
