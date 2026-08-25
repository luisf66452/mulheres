'use client';

import { useSyncExternalStore } from 'react';
import Script from 'next/script';
import {
  obterConsentimentoMarketing,
  obterConsentimentoMarketingNoServidor,
  inscreverConsentimentoMarketing,
} from '@/lib/consentimento/consentimentoMarketing';

// Código base do Meta Pixel. Só injeta o script (e o fallback <noscript>)
// depois que a usuária aceitar cookies de marketing — ver
// ConsentimentoMarketingBanner.tsx. useSyncExternalStore lê o localStorage já
// sincronizado com o React (sem setState dentro de useEffect) e usa
// 'indefinido' como snapshot do servidor — evita divergir do HTML
// renderizado lá e disparar aviso de hidratação. Reage a mudanças de
// consentimento feitas depois via evento customizado, sem precisar de reload
// da página. Montado uma única vez no layout raiz via next/script com id
// fixo, então o Next.js garante que ele carregue apenas uma vez mesmo com
// navegação entre rotas do App Router.
export default function FacebookPixel() {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const consentimento = useSyncExternalStore(
    inscreverConsentimentoMarketing,
    obterConsentimentoMarketing,
    obterConsentimentoMarketingNoServidor
  );

  if (!PIXEL_ID || consentimento !== 'aceito') return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      {/* React não consegue montar elementos filhos de verdade dentro de
          <noscript> no cliente (o navegador trata o conteúdo como texto
          quando JS está habilitado, então appendChild via React nunca
          aparece) — por isso o fallback usa dangerouslySetInnerHTML, igual
          ao snippet oficial da Meta. PIXEL_ID vem de env var de build, não
          de entrada da usuária, então não há risco de injeção aqui. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" alt="" />`,
        }}
      />
    </>
  );
}
