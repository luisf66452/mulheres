'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function enviarLinkMagico(email: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('[enviarLinkMagico] erro ao enviar OTP:', {
      email,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    // TEMPORÁRIO: expõe a mensagem real do Supabase para diagnóstico ao vivo — reverter depois.
    return { erro: `[debug] ${error.status ?? '?'} ${error.code ?? '?'}: ${error.message}` };
  }

  return {};
}
