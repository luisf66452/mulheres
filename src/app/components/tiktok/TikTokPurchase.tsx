'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { rastrearEvento, jaDisparado, marcarDisparado } from '@/lib/tiktok/eventos';

// Montado em /perfil/assinatura só quando a usuária volta do Stripe com
// ?checkout=sucesso&session_id=... (ver /api/stripe/checkout). Nunca confia
// só nesse retorno de navegação: consulta /api/stripe/confirmar-pagamento,
// que verifica direto no Stripe que a sessão é dessa usuária e que o
// pagamento foi mesmo efetivado, antes de reportar Purchase. O dedup usa o
// próprio session_id como chave — cada sessão de checkout só pode gerar um
// Purchase, mesmo com reload da página ou reentrega do evento do Stripe.
export default function TikTokPurchase({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const executouNestaMontagem = useRef(false);

  useEffect(() => {
    if (executouNestaMontagem.current) return;
    executouNestaMontagem.current = true;

    const chaveDedup = `purchase:${sessionId}`;

    async function confirmarEDisparar() {
      if (jaDisparado(chaveDedup)) {
        router.replace('/perfil/assinatura?checkout=sucesso', { scroll: false });
        return;
      }

      try {
        const resposta = await fetch(`/api/stripe/confirmar-pagamento?session_id=${encodeURIComponent(sessionId)}`);
        const dados = await resposta.json();

        if (resposta.ok && dados.confirmado) {
          rastrearEvento('Purchase', {
            value: dados.valor ?? undefined,
            currency: dados.moeda ?? undefined,
          });
          marcarDisparado(chaveDedup);
        }
      } catch {
        // Falha de rede ao confirmar não deve quebrar a página de
        // assinatura — só deixa de reportar o evento desta vez.
      }

      router.replace('/perfil/assinatura?checkout=sucesso', { scroll: false });
    }

    confirmarEDisparar();
  }, [router, sessionId]);

  return null;
}
