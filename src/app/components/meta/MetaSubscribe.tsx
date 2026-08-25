'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado } from '@/lib/meta/eventos';

// Montado em /perfil/assinatura junto com TikTokPurchase, só quando a
// usuária volta do Stripe com ?checkout=sucesso&session_id=... (ver
// /api/stripe/checkout). Nunca confia só nesse retorno de navegação: consulta
// /api/stripe/confirmar-pagamento, que verifica direto no Stripe que a
// sessão é dessa usuária e que o pagamento foi mesmo efetivado, antes de
// reportar Subscribe (evento padrão do Meta para assinaturas — este produto
// é uma assinatura recorrente, não uma compra avulsa). O dedup usa o próprio
// session_id como chave — cada sessão de checkout só pode gerar um Subscribe,
// mesmo com reload da página. Não mexe na URL — quem remove os parâmetros de
// retorno do Stripe é TikTokPurchase, montado ao lado.
export default function MetaSubscribe({ sessionId }: { sessionId: string }) {
  const executouNestaMontagem = useRef(false);

  useEffect(() => {
    if (executouNestaMontagem.current) return;
    executouNestaMontagem.current = true;

    const chaveDedup = `subscribe:${sessionId}`;
    if (jaDisparado(chaveDedup)) return;

    async function confirmarEDisparar() {
      try {
        const resposta = await fetch(`/api/stripe/confirmar-pagamento?session_id=${encodeURIComponent(sessionId)}`);
        const dados = await resposta.json();

        if (resposta.ok && dados.confirmado) {
          rastrearEvento('Subscribe', {
            value: dados.valor ?? undefined,
            currency: dados.moeda ?? undefined,
          });
          marcarDisparado(chaveDedup);
        }
      } catch {
        // Falha de rede ao confirmar não deve quebrar a página de
        // assinatura — só deixa de reportar o evento desta vez.
      }
    }

    confirmarEDisparar();
  }, [sessionId]);

  return null;
}
