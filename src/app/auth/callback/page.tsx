'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Fluxo implícito: a sessão (ou o erro) chega no fragmento da URL
// (#access_token=... ou #error_description=...), que nunca é enviado ao
// servidor — por isso essa etapa precisa rodar no navegador, diferente do
// antigo fluxo PKCE que trocava um "?code=" numa rota de servidor.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const erroSupabase = hash.get('error_description');
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
