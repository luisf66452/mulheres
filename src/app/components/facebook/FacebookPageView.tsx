'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { rastrearPageView } from '@/lib/meta/eventos';

// O script base (FacebookPixel.tsx) só roda uma vez, no carregamento inicial
// completo da página — o App Router nunca o reexecuta em navegações
// client-side (next/link), então sem isto só a primeira página visitada
// numa sessão gerava PageView, e o resto da navegação ficava invisível para
// o Meta Pixel. Monta uma única vez no layout raiz e dispara um novo PageView
// a cada troca de rota, pulando a primeira renderização para não duplicar o
// fbq('track', 'PageView') que o script base já disparou. Se o pixel ainda
// não carregou (sem consentimento de marketing), rastrearPageView() é um
// no-op — ver src/lib/meta/eventos.ts.
export default function FacebookPageView() {
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
