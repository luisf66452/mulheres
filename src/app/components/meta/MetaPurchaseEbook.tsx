'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado, aoFbqFicarDisponivel } from '@/lib/meta/eventos';

// Montado em /ebook/obrigado só quando o pagamento já foi confirmado
// direto no Stripe pelo Server Component (ver obterDownloadEbook) — ao
// contrário de MetaSubscribe/TikTokPurchase (funil de assinatura), não
// precisa refazer essa confirmação aqui: a página só chega a renderizar
// este componente depois de `confirmado === true`. O dedup usa o próprio
// session_id como chave — cada sessão de checkout só pode gerar um
// Purchase, mesmo com reload da página. Usa aoFbqFicarDisponivel e só marca
// como disparado depois do disparo de fato acontecer — este é o evento mais
// importante de todo o pixel (é ele que alimenta a otimização de ROAS), então
// não pode se perder silenciosamente se o pixel ainda estiver carregando
// quando a página de obrigado renderiza.
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
    const chaveDedup = `purchase-ebook:${sessionId}`;
    if (jaDisparado(chaveDedup)) return;

    return aoFbqFicarDisponivel(() => {
      if (executouNestaMontagem.current) return;
      executouNestaMontagem.current = true;

      rastrearEvento(
        'Purchase',
        {
          value: valor ?? undefined,
          currency: moeda ?? undefined,
        },
        sessionId
      );
      marcarDisparado(chaveDedup);
    });
  }, [sessionId, valor, moeda]);

  return null;
}
