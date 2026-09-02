'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';

export default function EbookClient({ precoExibicao }: { precoExibicao: string | null }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comprar() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/stripe/checkout-ebook', { method: 'POST' });
      const corpo = await resposta.json();
      if (!resposta.ok || !corpo.url) {
        setErro(corpo.erro ?? 'Não foi possível iniciar a compra agora.');
        setCarregando(false);
        return;
      }
      window.location.href = corpo.url;
    } catch {
      setErro('Não foi possível iniciar a compra agora. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="ebook-cta relative space-y-3 rounded-2xl border border-acao/25 bg-creme-rosado/35 p-4 text-center">
      {precoExibicao && (
        <div className="space-y-0.5">
          <p className="font-display text-3xl font-medium tracking-tight text-texto tabular-nums">{precoExibicao}</p>
          <p className="text-xs text-texto-suave">pagamento único · acesso pra sempre</p>
        </div>
      )}
      <Botao type="button" onClick={comprar} disabled={carregando}>
        {carregando ? 'Abrindo pagamento...' : 'Quero começar hoje'}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
