import type Stripe from 'stripe';
import { PAISES_SUPORTADOS, type PaisSuportado } from '@/lib/perfil/pais';

// IDs de preço reais do Stripe (painel do Stripe, não hardcoded em valor de
// R$ — quem define o preço é o Stripe, o app só referencia o price id).
export type PlanoStripe = 'mensal' | 'anual';

export type MoedaStripe = 'brl' | 'eur';

// Os Prices no Stripe são multimoeda (currency_options) — mesma price id
// para as duas moedas, quem decide qual é usada em cada Checkout Session é
// este mapa, nunca o cliente (ver /api/stripe/checkout).
const MOEDA_POR_PAIS: Record<PaisSuportado, MoedaStripe> = {
  BR: 'brl',
  PT: 'eur',
};

const LOCALE_POR_PAIS: Record<PaisSuportado, Stripe.Checkout.SessionCreateParams.Locale> = {
  BR: 'pt-BR',
  PT: 'pt',
};

function ehPaisSuportado(valor: string | null | undefined): valor is PaisSuportado {
  return valor != null && (PAISES_SUPORTADOS as readonly string[]).includes(valor);
}

// Perfis sem país reconhecido (linha ainda sem confirmação, dado legado fora
// de PAISES_SUPORTADOS) caem em Portugal/EUR — mesmo default de perfis.pais
// (migração 0032) e moeda em que os Prices já existiam antes desta correção,
// então nunca é uma moeda nova/inesperada para o negócio.
const PAIS_FALLBACK: PaisSuportado = 'PT';

export function obterMoedaELocaleDoPais(pais: string | null | undefined): {
  moeda: MoedaStripe;
  locale: Stripe.Checkout.SessionCreateParams.Locale;
} {
  const paisResolvido = ehPaisSuportado(pais) ? pais : PAIS_FALLBACK;
  return { moeda: MOEDA_POR_PAIS[paisResolvido], locale: LOCALE_POR_PAIS[paisResolvido] };
}

// Só para exibir o preço na página de planos antes do redirecionamento para
// o Checkout — o unit_amount vem sempre de um price.retrieve real ao
// Stripe (ver /perfil/assinatura), nunca de um valor fixo aqui.
export function formatarPrecoExibicao(unitAmount: number, moeda: MoedaStripe): string {
  const valor = (unitAmount / 100).toFixed(2).replace('.', ',');
  return moeda === 'brl' ? `R$ ${valor}` : `${valor} €`;
}

// Um Price multimoeda pode não ter currency_options para a moeda pedida
// (configuração incompleta no Stripe) — retorna null nesse caso para quem
// chamar decidir o que fazer, em vez de cair silenciosamente na moeda
// default do Price (ver /api/stripe/checkout e /perfil/assinatura).
export function obterUnitAmountNaMoeda(
  price: Pick<Stripe.Price, 'currency' | 'unit_amount' | 'currency_options'>,
  moeda: MoedaStripe
): number | null {
  if (price.currency === moeda) return price.unit_amount;
  const opcao = price.currency_options?.[moeda];
  return typeof opcao?.unit_amount === 'number' ? opcao.unit_amount : null;
}

// Busca o preço real de um plano no Stripe, já na moeda da usuária, para
// exibir na página de planos antes do redirecionamento para o Checkout.
// Retorna null (em vez de lançar) em qualquer falha — a página não deve
// quebrar por causa disso, só omitir o preço.
export async function buscarPrecoExibicao(
  stripe: Stripe,
  priceId: string | null,
  moeda: MoedaStripe
): Promise<string | null> {
  if (!priceId) return null;
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    return unitAmount === null ? null : formatarPrecoExibicao(unitAmount, moeda);
  } catch (erro) {
    console.error('[stripe/planos] falha ao buscar preço para exibição', {
      priceId,
      moeda,
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return null;
  }
}

// Igual a buscarPrecoExibicao, mas também devolve o unitAmount bruto — usado
// onde além de mostrar o preço formatado é preciso comparar valores (ex.:
// calcular o desconto real do anual em relação ao mensal).
export async function buscarPrecoDetalhado(
  stripe: Stripe,
  priceId: string | null,
  moeda: MoedaStripe
): Promise<{ formatado: string; unitAmount: number } | null> {
  if (!priceId) return null;
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    return unitAmount === null ? null : { formatado: formatarPrecoExibicao(unitAmount, moeda), unitAmount };
  } catch (erro) {
    console.error('[stripe/planos] falha ao buscar preço detalhado', {
      priceId,
      moeda,
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return null;
  }
}

// Desconto real do plano anual frente a pagar o mensal 12x, sempre a partir
// dos unitAmount reais do Stripe — nunca um percentual fixo que possa
// dessincronizar se o preço mudar no painel.
export function calcularPercentualEconomiaAnual(unitAmountMensal: number, unitAmountAnual: number): number {
  const totalMensalAnualizado = unitAmountMensal * 12;
  if (totalMensalAnualizado <= 0) return 0;
  const economia = totalMensalAnualizado - unitAmountAnual;
  return Math.max(0, Math.round((economia / totalMensalAnualizado) * 100));
}

const ROTULOS: Record<PlanoStripe, string> = {
  mensal: 'Rose Pro — mensal',
  anual: 'Rose Pro — anual',
};

export function rotuloPlano(plano: PlanoStripe): string {
  return ROTULOS[plano];
}

export function ehPlanoValido(valor: string): valor is PlanoStripe {
  return valor === 'mensal' || valor === 'anual';
}

export function obterPriceId(plano: PlanoStripe): string | null {
  const mapa: Record<PlanoStripe, string | undefined> = {
    mensal: process.env.STRIPE_PRICE_ID_MENSAL,
    anual: process.env.STRIPE_PRICE_ID_ANUAL,
  };
  return mapa[plano] ?? null;
}

export function stripeConfigurado(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      (process.env.STRIPE_PRICE_ID_MENSAL || process.env.STRIPE_PRICE_ID_ANUAL)
  );
}

// Price avulso (one-time) do ebook — separado dos price ids de assinatura
// (STRIPE_PRICE_ID_MENSAL/ANUAL) porque é um mode: 'payment', não
// 'subscription'. Mesmo padrão de degradar honestamente (null) quando não
// configurado, em vez de lançar.
export function obterPriceIdEbook(): string | null {
  return process.env.STRIPE_PRICE_ID_EBOOK || null;
}

export function ebookConfigurado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_EBOOK);
}
