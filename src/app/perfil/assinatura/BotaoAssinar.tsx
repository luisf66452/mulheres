'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';
import type { PlanoStripe } from '@/lib/stripe/planos';
import { rastrearEvento } from '@/lib/tiktok/eventos';

export default function BotaoAssinar({ plano, rotulo }: { plano: PlanoStripe; rotulo: string }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciarCheckout() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.url) {
        setErro(dados.erro ?? 'Não foi possível iniciar a assinatura agora.');
        setCarregando(false);
        return;
      }
      // Só dispara quando a sessão de checkout do Stripe foi mesmo criada
      // (não no clique do botão) — valor/moeda vêm do price real do Stripe,
      // retornado por /api/stripe/checkout.
      rastrearEvento('InitiateCheckout', {
        value: dados.valor ?? undefined,
        currency: dados.moeda ?? undefined,
      });
      window.location.href = dados.url;
    } catch {
      setErro('Não foi possível iniciar a assinatura agora. Verifique sua conexão.');
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-2">
      <Botao type="button" disabled={carregando} onClick={iniciarCheckout} className="w-full">
        {carregando ? 'Abrindo checkout seguro…' : rotulo}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}
