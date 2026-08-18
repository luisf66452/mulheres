'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function salvarHorarioPreferido(horario: string, fusoHorario?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('perfis')
    .update({
      horario_preferido_notificacao: horario,
      ...(fusoHorario ? { fuso_horario: fusoHorario } : {}),
    })
    .eq('id', user.id);
}
