'use client';

import { useSyncExternalStore } from 'react';
import {
  obterConsentimentoMarketing,
  obterConsentimentoMarketingNoServidor,
  inscreverConsentimentoMarketing,
  definirConsentimentoMarketing,
} from '@/lib/consentimento/consentimentoMarketing';

// Único ponto do app que pede consentimento para cookies/pixels de
// marketing (hoje só o Meta Pixel — ver FacebookPixel.tsx, que só carrega
// depois que esta escolha for "aceito"). useSyncExternalStore lê o
// localStorage já sincronizado com o React (sem setState dentro de
// useEffect) e usa 'indefinido' como snapshot do servidor, já que
// localStorage não existe lá — evita divergir do HTML renderizado no
// servidor e disparar aviso de hidratação.
export default function ConsentimentoMarketingBanner() {
  const estado = useSyncExternalStore(
    inscreverConsentimentoMarketing,
    obterConsentimentoMarketing,
    obterConsentimentoMarketingNoServidor
  );

  if (estado !== 'indefinido') return null;

  return (
    <div
      role="region"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-borda bg-superficie p-4 shadow-[0_-2px_12px_rgba(74,63,53,0.12)]"
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-texto-suave">
          Usamos cookies de marketing para entender a origem das visitas. Você pode aceitar ou
          recusar — isso não afeta o funcionamento do app.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => definirConsentimentoMarketing('recusado')}
            className="rounded-2xl border border-borda px-4 py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-fundo"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => definirConsentimentoMarketing('aceito')}
            className="rounded-2xl bg-acao px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-acao/90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
