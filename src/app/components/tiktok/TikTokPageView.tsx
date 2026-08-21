'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { rastrearPageView } from '@/lib/tiktok/eventos';

// O script base (TikTokPixel.tsx) só roda uma vez, no carregamento inicial
// completo da página — o App Router nunca o reexecuta em navegações
// client-side (next/link), então sem isto só a primeira página visitada
// numa sessão gerava PageView, e o resto da navegação ficava invisível para
// o TikTok. Monta uma única vez no layout raiz e dispara um novo PageView a
// cada troca de rota, pulando a primeira renderização para não duplicar o
// ttq.page() que o script base já disparou.
export default function TikTokPageView() {
  const pathname = usePathname();
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    rastrearPageView();
  }, [pathname]);

  return null;
}
