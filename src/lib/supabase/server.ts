import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Mesmo flowType do cliente do navegador (ver client.ts) — é este
      // cliente que chama signInWithOtp em enviarLinkMagico, e é o flowType
      // usado nessa chamada que decide se o Supabase gera um link mágico com
      // "?code=" (PKCE) ou com o token direto no fragmento (implícito).
      auth: { flowType: 'implicit' },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component without a response to write to; safe to ignore
          }
        },
      },
    }
  );
}
