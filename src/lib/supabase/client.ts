import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// @supabase/ssr força flowType 'pkce' internamente e ignora qualquer
// override passado aqui (createBrowserClient.js do pacote define flowType
// depois do spread de options.auth) — não adianta tentar mudar para
// 'implicit' nesta função. Ver login/actions.ts para o motivo de o login
// usar código de 6 dígitos (verifyOtp) em vez de depender do link.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
