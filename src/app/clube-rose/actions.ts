'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type ResultadoResgate =
  | { ok: true; saldoRestante: number; status: 'solicitado' }
  | {
      ok: false;
      motivo:
        | 'nao_autenticada'
        | 'nao_premium'
        | 'recompensa_invalida'
        | 'recompensa_indisponivel'
        | 'sem_estoque'
        | 'ja_resgatada'
        | 'saldo_insuficiente'
        | 'nao_permitido';
    };

// O custo/estoque/status "de verdade" vêm do banco (recompensas_catalogo,
// migração 0014) e são revalidados de novo dentro da própria RPC — esta ação
// só faz uma pré-checagem para dar um erro específico sem gastar uma
// chamada de RPC à toa. Nunca confia em custo vindo do cliente.
export async function resgatarRecompensa(recompensaChave: string): Promise<ResultadoResgate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, motivo: 'nao_autenticada' };
  }

  const [{ data: catalogo }, { data: perfil }] = await Promise.all([
    supabase.from('recompensas_catalogo').select('status, requer_premium').eq('chave', recompensaChave).maybeSingle(),
    supabase.from('perfis').select('plano').eq('id', user.id).single(),
  ]);

  if (!catalogo || catalogo.status !== 'ativa') {
    return { ok: false, motivo: catalogo ? 'recompensa_indisponivel' : 'recompensa_invalida' };
  }

  if (catalogo.requer_premium && perfil?.plano !== 'premium') {
    return { ok: false, motivo: 'nao_premium' };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, motivo: 'nao_permitido' };
  }

  const { data, error } = await adminClient.rpc('resgatar_recompensa', {
    p_usuaria_id: user.id,
    p_recompensa_chave: recompensaChave,
  });

  if (error) {
    console.error('Falha ao resgatar recompensa:', error);
    return { ok: false, motivo: 'nao_permitido' };
  }

  const resultado = Array.isArray(data) ? data[0] : data;

  if (!resultado?.resgatado || resultado.saldo === null) {
    const motivo = resultado?.motivo;
    if (
      motivo === 'recompensa_invalida' ||
      motivo === 'recompensa_indisponivel' ||
      motivo === 'sem_estoque' ||
      motivo === 'ja_resgatada' ||
      motivo === 'saldo_insuficiente'
    ) {
      return { ok: false, motivo };
    }
    return { ok: false, motivo: 'nao_permitido' };
  }

  revalidatePath('/clube-rose');
  return { ok: true, saldoRestante: resultado.saldo, status: 'solicitado' };
}
