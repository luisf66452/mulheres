'use client';

import { useState } from 'react';
import { rastrearEvento } from '@/lib/meta/eventos';

const NOME_PRODUTO = 'Guia Rose — Ebook 21 dias';
const VALOR_PRODUTO = 29.99;

type EbookClientProps = {
  precoExibicao: string | null;
  /** Onde este CTA aparece na página — vai no evento InitiateCheckout pra medir qual bloco converte mais. */
  location?: string;
  rotulo?: string;
  className?: string;
  /** Mostra o order bump da assinatura Rose Pro nesse CTA. Só o CTA principal (hero) mostra, pra não poluir os outros blocos. */
  mostrarBump?: boolean;
  precoBumpExibicao?: string | null;
  /** Valor numérico da assinatura, em reais — usado pra somar ao evento InitiateCheckout quando o bump está marcado. */
  precoBumpValor?: number | null;
};

export default function EbookClient({
  precoExibicao,
  location = 'hero',
  rotulo = 'Quero começar hoje',
  className = '',
  mostrarBump = false,
  precoBumpExibicao,
  precoBumpValor,
}: EbookClientProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [comBump, setComBump] = useState(false);

  async function comprar() {
    setCarregando(true);
    setErro(null);
    const valorEvento = comBump && precoBumpValor ? VALOR_PRODUTO + precoBumpValor : VALOR_PRODUTO;
    rastrearEvento('InitiateCheckout', {
      content_name: NOME_PRODUTO,
      value: valorEvento,
      currency: 'BRL',
      location,
    });
    try {
      const resposta = await fetch('/api/stripe/checkout-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comBump }),
      });
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
    <div className="space-y-3">
      {precoExibicao && (
        <div className="space-y-0.5 text-center">
          <p className="font-[family-name:var(--eb-font-serif)] text-3xl font-medium tracking-tight text-[var(--eb-ink)] tabular-nums">
            {precoExibicao}
          </p>
          <p className="text-xs text-[var(--eb-ink)]/60">pagamento único · acesso pra sempre</p>
        </div>
      )}
      {mostrarBump && (
        <label className="flex items-start gap-2 rounded-xl border border-[var(--eb-ink)]/15 bg-white/60 p-3 text-left text-sm text-[var(--eb-ink)]/80">
          <input
            type="checkbox"
            checked={comBump}
            onChange={(evento) => setComBump(evento.target.checked)}
            className="mt-0.5"
          />
          <span>
            Quero também a assinatura <strong>Rose Pro</strong> — 1º mês por {precoBumpExibicao ?? 'R$ 9,99'}{' '}
            (cancele quando quiser)
          </span>
        </label>
      )}
      <button
        type="button"
        onClick={comprar}
        disabled={carregando}
        className={
          className ||
          'ebook-cta-glow w-full rounded-full bg-[var(--eb-bordo)] px-8 py-4 text-center text-sm font-bold tracking-wide text-white uppercase shadow-lg shadow-[var(--eb-bordo)]/25 transition-all hover:-translate-y-0.5 hover:bg-[var(--eb-wine)] disabled:pointer-events-none disabled:opacity-40'
        }
      >
        {carregando ? 'Abrindo pagamento...' : rotulo}
      </button>
      {erro && (
        <p role="alert" className="text-center text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
