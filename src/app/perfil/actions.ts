'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizarNome } from '@/lib/perfil/nome';

export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function atualizarNome(nomeBruto: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({ nome: normalizarNome(nomeBruto) })
    .eq('id', user.id);

  if (error) {
    return { erro: 'Não foi possível salvar seu nome. Tente novamente.' };
  }

  redirect('/perfil');
}
