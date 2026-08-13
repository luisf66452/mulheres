'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function exportarMeusDados(): Promise<{ erro?: string; dados?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: perfil, error: erroPerfil }, { data: checkins, error: erroCheckins }, { data: sessoes, error: erroSessoes }] =
    await Promise.all([
      supabase.from('perfis').select('*').eq('id', user.id).single(),
      supabase.from('checkins').select('*').eq('usuaria_id', user.id),
      supabase.from('sessoes').select('*').eq('usuaria_id', user.id),
    ]);

  if (erroPerfil || erroCheckins || erroSessoes) {
    return { erro: 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  const pacote = {
    exportado_em: new Date().toISOString(),
    conta: { id: user.id, email: user.email, criado_em: user.created_at },
    perfil,
    checkins,
    sessoes,
  };

  return { dados: JSON.stringify(pacote, null, 2) };
}

export async function enviarConfirmacaoExclusao(): Promise<{ erro?: string; emailEnviado?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login');
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? `https://${headersList.get('host')}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      emailRedirectTo: `${origin}/api/perfil/confirmar-exclusao`,
    },
  });

  if (error) {
    return { erro: 'Não foi possível enviar o link de confirmação. Tente novamente.' };
  }

  return { emailEnviado: user.email };
}
