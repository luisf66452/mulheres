'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { aplicarPreferenciasNoDocumento, obterConfiguracoesDispositivo } from '@/lib/perfil/configuracoesDispositivo';

// Montado uma vez no layout raiz: aplica tema/tamanho de texto/redução de
// animações no elemento <html> em toda página, incluindo as não
// autenticadas (login, política de privacidade). Escuta onAuthStateChange
// (em vez de só ler a sessão uma vez) para reaplicar as preferências certas
// quando a usuária troca de conta dentro da mesma sessão do app (logout →
// login de outra pessoa no mesmo dispositivo, sem recarregar a página) — sem
// isso, o <html> continuaria com o data-tema/tamanho-texto da conta anterior.
export default function AplicarPreferenciasDispositivo() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function aplicar(usuariaId: string | null) {
      aplicarPreferenciasNoDocumento(obterConfiguracoesDispositivo(usuariaId));
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => aplicar(session?.user?.id ?? null))
      .catch(() => aplicar(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      aplicar(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
