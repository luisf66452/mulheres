'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { RECOMPENSAS } from '@/lib/clube-rose/recompensas';

export type ResultadoResgate =
  | { ok: true; saldoRestante: number }
  | { ok: false; motivo: 'nao_autenticada' | 'nao_premium' | 'recompensa_invalida' | 'nao_permitido' };

export async function resgatarRecompensa(recompensaChave: string): Promise<ResultadoResgate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, motivo: 'nao_autenticada' };
  }

  const recompensa = RECOMPENSAS.find((r) => r.chave === recompensaChave);
  if (!recompensa || !recompensa.resgatavel) {
    return { ok: false, motivo: 'recompensa_invalida' };
  }

  const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();

  if (perfil?.plano !== 'premium') {
    return { ok: false, motivo: 'nao_premium' };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, motivo: 'nao_permitido' };
  }

  const { data, error } = await adminClient.rpc('resgatar_recompensa', {
    p_usuaria_id: user.id,
    p_recompensa_chave: recompensa.chave,
    p_custo: recompensa.custo,
  });

  if (error) {
    console.error('Falha ao resgatar recompensa:', error);
    return { ok: false, motivo: 'nao_permitido' };
  }

  const resultado = Array.isArray(data) ? data[0] : data;

  if (!resultado?.resgatado) {
    return { ok: false, motivo: 'nao_permitido' };
  }

  revalidatePath('/clube-rose');
  return { ok: true, saldoRestante: resultado.saldo };
}
