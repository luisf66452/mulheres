import { obterStripe } from '@/lib/stripe/client';
import { buscarPrecoExibicao, ebookConfigurado, obterMoedaELocaleDoPais, obterPriceIdEbook } from '@/lib/stripe/planos';
import EbookClient from './EbookClient';

// Sem conta/país confirmado nesta rota (compra sem login) — mesma decisão
// já usada em /comecar/resultado: exibe o preço em BRL como padrão. O
// Stripe Checkout ainda pode ajustar a cobrança pelo país real do cartão.
export default async function EbookPage() {
  let precoExibicao: string | null = null;

  if (ebookConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      precoExibicao = await buscarPrecoExibicao(stripe, obterPriceIdEbook(), moeda);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <img src="/rose-ebook-capa.png" alt="Capa do ebook Rose Reset 21 dias" className="mx-auto w-48 rounded-2xl shadow-lg" />

      <div className="space-y-2.5 text-center">
        <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-tight text-texto sm:text-3xl">
          Rose Reset: 21 dias para se reconectar com você mesma
        </h1>
        <p className="leading-relaxed text-texto-suave">
          Um guia passo a passo, direto ao ponto, para sair do piloto automático e recomeçar sua relação com o
          autocuidado — sem dieta, sem culpa, sem depender de mais ninguém.
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto">
        <p className="font-semibold">O que você recebe:</p>
        <ul className="space-y-1.5">
          <li>✓ 21 práticas guiadas, uma por dia</li>
          <li>✓ Formato PDF, leia no seu ritmo, no celular ou impresso</li>
          <li>✓ Acesso imediato após a compra</li>
        </ul>
      </div>

      <EbookClient precoExibicao={precoExibicao} />

      <p className="text-center text-xs text-texto-suave">Pagamento seguro. Acesso liberado na hora.</p>
    </main>
  );
}
