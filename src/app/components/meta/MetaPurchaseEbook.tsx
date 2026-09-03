'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado } from '@/lib/meta/eventos';

// Montado em /ebook/obrigado só quando o pagamento já foi confirmado
// direto no Stripe pelo Server Component (ver obterDownloadEbook) — ao
// contrário de MetaSubscribe/TikTokPurchase (funil de assinatura), não
// precisa refazer essa confirmação aqui: a página só chega a renderizar
// este componente depois de `confirmado === true`. O dedup usa o próprio
// session_id como chave — cada sessão de checkout só pode gerar um
// Purchase, mesmo com reload da página.
export default function MetaPurchaseEbook({
  sessionId,
  valor,
  moeda,
}: {
  sessionId: string;
  valor: number | null;
  moeda: string | null;
}) {
  const executouNestaMontagem = useRef(false);

  useEffect(() => {
    if (executouNestaMontagem.current) return;
    executouNestaMontagem.current = true;

    const chaveDedup = `purchase-ebook:${sessionId}`;
    if (jaDisparado(chaveDedup)) return;

    rastrearEvento('Purchase', {
      value: valor ?? undefined,
      currency: moeda ?? undefined,
    });
    marcarDisparado(chaveDedup);
  }, [sessionId, valor, moeda]);

  return null;
}
