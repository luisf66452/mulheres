'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function enviarLinkMagico(email: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const headersList = await headers();
  const origin = headersList.get('origin') ?? `https://${headersList.get('host')}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('[enviarLinkMagico] erro ao enviar OTP:', {
      email,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return { erro: 'Aguarde alguns segundos antes de pedir outro link.' };
    }
    return { erro: 'Não foi possível enviar o link. Tente novamente.' };
  }

  return {};
}
