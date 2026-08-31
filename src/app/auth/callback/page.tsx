'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Fallback para quem ainda clica no link do e-mail em vez de digitar o
// código de 6 dígitos (ver login/actions.ts) — @supabase/ssr sempre usa PKCE
// por baixo (não dá pra trocar, ver client.ts), então o link só funciona
// quando aberto no mesmo navegador que pediu o login. O erro chega como
// query string (?error_description=...) nesse caso; hash só existiria num
// fluxo implícito, que este projeto não usa — checamos os dois por segurança.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const erroSupabase = query.get('error_description') ?? hash.get('error_description');
    if (erroSupabase) {
      router.replace(`/login?erro=${encodeURIComponent(erroSupabase)}`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace(`/login?erro=${encodeURIComponent('Link de acesso inválido ou expirado.')}`);
        return;
      }
      // Mesmo marcador usado pelo antigo callback de servidor — aciona a
      // oferta do Rose Pro uma vez, logo após um login bem-sucedido.
      router.replace('/?entrada=1');
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo p-6">
      <p className="text-texto-suave">Entrando...</p>
    </main>
  );
}
