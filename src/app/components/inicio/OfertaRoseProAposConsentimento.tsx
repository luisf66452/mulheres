'use client';

import { useSyncExternalStore } from 'react';
import {
  inscreverConsentimentoMarketing,
  obterConsentimentoMarketing,
  obterConsentimentoMarketingNoServidor,
} from '@/lib/consentimento/consentimentoMarketing';
import OfertaRosePro from './OfertaRosePro';

/**
 * A escolha de cookies vem antes da oferta para que dois avisos globais nunca
 * disputem a tela no primeiro acesso. Tanto aceitar quanto recusar libera a
 * oferta — a decisão de marketing não muda o acesso ao app.
 */
export default function OfertaRoseProAposConsentimento({ precoMensal = null }: { precoMensal?: string | null }) {
  const consentimento = useSyncExternalStore(
    inscreverConsentimentoMarketing,
    obterConsentimentoMarketing,
    obterConsentimentoMarketingNoServidor
  );

  if (consentimento === 'indefinido') return null;

  return <OfertaRosePro precoMensal={precoMensal} />;
}
