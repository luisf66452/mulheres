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

// Confirma o código de 6 dígitos enviado por e-mail (mesmo pedido acima,
// signInWithOtp manda os dois: link e código). Não depende de nenhum estado
// salvo no navegador que pediu o código — funciona mesmo que o código seja
// digitado num navegador/dispositivo diferente, ao contrário do link.
export async function confirmarCodigoAcesso(email: string, codigo: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: 'email' });

  if (error) {
    console.error('[confirmarCodigoAcesso] erro ao verificar código:', {
      email,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Código inválido ou expirado. Peça um novo código.' };
  }

  return {};
}
