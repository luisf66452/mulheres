import RosasDecorativas from '@/app/components/decoracao/RosasDecorativas';
import { obterStripe } from '@/lib/stripe/client';
import { buscarPrecoExibicao, ebookConfigurado, obterMoedaELocaleDoPais, obterPriceIdEbook } from '@/lib/stripe/planos';
import EbookClient from './EbookClient';

// Revalida a cada hora — sem isso, Next.js prerenderia esta página estática
// no build e o preço exibido ficaria congelado no valor de build time,
// mesmo que o Price no Stripe (ou STRIPE_PRICE_ID_EBOOK) mude depois.
export const revalidate = 3600;

// 21 dias reais do guia (mesmo número usado no título e no Stripe) — o
// rastreador visual é literal, não decorativo: um pontinho por dia. As
// cores ciclam pelos tons de acento já existentes no tema (nunca cores
// novas), os mesmos usados nos indicadores de humor do app.
const DIAS_DO_GUIA = Array.from({ length: 21 }, (_, indice) => indice + 1);
const CORES_DO_RASTREADOR = [
  'var(--color-acao)',
  'var(--color-salvia)',
  'var(--color-destaque)',
  'var(--color-humor-2)',
  'var(--color-pessego)',
];

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
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-7 overflow-hidden p-6">
      <RosasDecorativas tamanho="compacto" />

      <div className="ebook-bloco ebook-bloco-1 relative space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-creme-rosado/60 px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-acao uppercase">
          Guia Rose · Ebook
        </span>
        <h1 className="font-display text-[2.1rem] leading-[1.08] font-medium tracking-tight text-texto sm:text-[2.5rem]">
          21 dias pra sair do piloto automático
        </h1>
        <p className="text-base leading-relaxed text-texto-suave">
          Um guia diário, direto ao ponto — 5 a 10 minutos por dia pra voltar a se sentir em casa no seu corpo.
        </p>
      </div>

      <div className="ebook-bloco ebook-bloco-2 relative flex justify-center py-1">
        <img
          src="/rose-ebook-capa.png"
          alt="Capa do ebook Rose Reset: 21 dias"
          className="ebook-capa w-44 rounded-2xl shadow-[0_18px_40px_rgba(184,105,122,0.28)] sm:w-52"
        />
      </div>

      <div className="ebook-bloco ebook-bloco-3 relative space-y-1.5 text-center">
        <p className="font-display text-lg leading-snug text-texto italic">
          &ldquo;Você se compara. Evita o espelho. Sabe que precisa se cuidar — só não sabe por onde
          começar.&rdquo;
        </p>
        <p className="text-sm text-texto-suave">Comece aqui, no dia 1, exatamente como você está agora.</p>
      </div>

      <div className="ebook-bloco ebook-bloco-4 relative space-y-3 rounded-2xl border border-borda bg-superficie/70 p-4">
        <div className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
          {DIAS_DO_GUIA.map((dia) => (
            <span
              key={dia}
              className="ebook-ponto h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: CORES_DO_RASTREADOR[dia % CORES_DO_RASTREADOR.length],
                animationDelay: `${dia * 0.035}s`,
              }}
            />
          ))}
        </div>
        <p className="text-center text-sm font-medium text-texto">21 dias. 21 práticas. Uma de cada vez.</p>
        <p className="text-center text-xs text-texto-suave">
          Pulou um dia? Sem culpa — é só voltar amanhã de onde parou.
        </p>
      </div>

      <div className="ebook-bloco ebook-bloco-5 relative space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto">
        <p className="font-semibold">O que você recebe</p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-0.5 text-acao">✓</span>
            <span>Uma prática guiada por dia, sem enrolação</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-0.5 text-acao">✓</span>
            <span>PDF pra ler no celular ou impresso, no seu ritmo</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-0.5 text-acao">✓</span>
            <span>Acesso liberado na hora, direto após o pagamento</span>
          </li>
        </ul>
      </div>

      <div className="ebook-bloco ebook-bloco-6 relative">
        <EbookClient precoExibicao={precoExibicao} />
      </div>

      <p className="ebook-bloco ebook-bloco-7 relative text-center text-xs text-texto-suave">
        Pagamento seguro pela Stripe. Pagamento único — sem assinatura, sem cobrança recorrente.
      </p>
    </main>
  );
}
