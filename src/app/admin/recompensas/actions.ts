'use server';

import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/admin/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { StatusRecompensaCatalogo } from '@/lib/supabase/types';

export async function atualizarStatusRecompensa(
  chave: string,
  novoStatus: StatusRecompensaCatalogo
): Promise<{ ok: boolean; erro?: string }> {
  await exigirAdmin();

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, erro: 'Erro interno.' };
  }

  const { error } = await adminClient
    .from('recompensas_catalogo')
    .update({ status: novoStatus, atualizada_em: new Date().toISOString() })
    .eq('chave', chave);

  if (error) {
    console.error('[atualizarStatusRecompensa] erro:', error);
    return { ok: false, erro: 'Não foi possível atualizar agora.' };
  }

  revalidatePath('/admin/recompensas');
  revalidatePath('/clube-rose');
  return { ok: true };
}

export async function atualizarEstoqueRecompensa(
  chave: string,
  novoEstoque: number | null
): Promise<{ ok: boolean; erro?: string }> {
  await exigirAdmin();

  if (novoEstoque !== null && (!Number.isInteger(novoEstoque) || novoEstoque < 0)) {
    return { ok: false, erro: 'Estoque inválido.' };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, erro: 'Erro interno.' };
  }

  const { error } = await adminClient
    .from('recompensas_catalogo')
    .update({ estoque: novoEstoque, atualizada_em: new Date().toISOString() })
    .eq('chave', chave);

  if (error) {
    console.error('[atualizarEstoqueRecompensa] erro:', error);
    return { ok: false, erro: 'Não foi possível atualizar agora.' };
  }

  revalidatePath('/admin/recompensas');
  revalidatePath('/clube-rose');
  return { ok: true };
}
