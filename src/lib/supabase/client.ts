import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Fluxo implícito (em vez de PKCE): o link mágico entrega a sessão direto
    // no fragmento da URL, sem precisar de um "code verifier" salvo no mesmo
    // navegador que pediu o link. Isso evita o erro "code challenge does not
    // match" quando o e-mail é aberto num app diferente (ex.: navegador
    // interno do Gmail) — troca de segurança consciente por compatibilidade.
    { auth: { flowType: 'implicit' } }
  );
}
