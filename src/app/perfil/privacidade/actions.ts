'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { coletarDadosExportaveis } from '@/lib/exportacao/coletarDados';

export async function exportarMeusDados(): Promise<{ erro?: string; dados?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resultado = await coletarDadosExportaveis(supabase, {
    id: user.id,
    email: user.email ?? null,
    criado_em: user.created_at,
  });

  if (resultado.erro || !resultado.pacote) {
    return { erro: resultado.erro ?? 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  return { dados: JSON.stringify(resultado.pacote, null, 2) };
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
    console.error('[privacidade] Falha ao enviar link de confirmação de exclusão', {
      code: error.code,
      message: error.message,
    });
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return { erro: 'Aguarde alguns segundos antes de pedir outro link.' };
    }
    return { erro: 'Não foi possível enviar o link de confirmação. Tente novamente.' };
  }

  return { emailEnviado: user.email };
}
