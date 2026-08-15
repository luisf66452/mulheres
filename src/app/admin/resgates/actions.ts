'use server';

import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/admin/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { StatusResgateRecompensa } from '@/lib/supabase/types';

export type ResultadoRevisao = { ok: true } | { ok: false; motivo: string };

// Toda ação aqui passa pela mesma checagem de admin do layout (defesa em
// profundidade: Server Actions podem ser chamadas independente de qual
// página as renderizou) e pela RPC revisar_resgate (migração 0017), que
// valida a transição de estado e faz o estorno de Pétalas quando aplicável
// — a lógica de negócio fica no banco, não duplicada aqui.
export async function revisarResgate(
  resgateId: string,
  novoStatus: Exclude<StatusResgateRecompensa, 'solicitado'>,
  observacao: string
): Promise<ResultadoRevisao> {
  const admin = await exigirAdmin();

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, motivo: 'Erro interno.' };
  }

  const { data, error } = await adminClient.rpc('revisar_resgate', {
    p_admin_id: admin.id,
    p_resgate_id: resgateId,
    p_novo_status: novoStatus,
    p_observacao: observacao.trim() || null,
  });

  if (error) {
    console.error('[revisarResgate] erro na RPC:', error);
    return { ok: false, motivo: 'Não foi possível atualizar o pedido agora.' };
  }

  const resultado = Array.isArray(data) ? data[0] : data;
  if (!resultado?.atualizado) {
    return { ok: false, motivo: resultado?.motivo ?? 'Não foi possível atualizar o pedido.' };
  }

  revalidatePath('/admin/resgates');
  return { ok: true };
}
