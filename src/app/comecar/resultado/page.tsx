import { obterStripe } from '@/lib/stripe/client';
import {
  buscarPrecoDetalhado,
  calcularPercentualEconomiaAnual,
  formatarPrecoExibicao,
  obterMoedaELocaleDoPais,
  obterPriceId,
  stripeConfigurado,
} from '@/lib/stripe/planos';
import ResultadoClient from './ResultadoClient';

// Sem isso, Next.js prerenderia esta página estática no build e o preço
// exibido ficaria congelado no valor de build time — mesmo bug já corrigido
// em /ebook/page.tsx: se STRIPE_PRICE_ID_MENSAL/ANUAL forem configurados ou
// alterados na Vercel depois de um deploy, esta página continuaria mostrando
// a versão sem preço até o próximo build manual, sem essa revalidação.
export const revalidate = 3600;

// Ainda não existe conta/país confirmado nesta etapa do funil (é pré-login)
// — usa BRL como padrão. O preço final por país é confirmado depois, em
// /perfil/assinatura, já com a conta criada.
export default async function ComecarResultadoPage() {
  let precoMensal: string | null = null;
  let precoAnual: string | null = null;
  let percentualEconomiaAnual: number | null = null;
  let precoAnualPorMes: string | null = null;
  let precoMensalPorDia: string | null = null;

  if (stripeConfigurado()) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais('BR');
      const [detalheMensal, detalheAnual] = await Promise.all([
        buscarPrecoDetalhado(stripe, obterPriceId('mensal'), moeda),
        buscarPrecoDetalhado(stripe, obterPriceId('anual'), moeda),
      ]);
      precoMensal = detalheMensal?.formatado ?? null;
      precoAnual = detalheAnual?.formatado ?? null;
      if (detalheMensal && detalheAnual) {
        percentualEconomiaAnual = calcularPercentualEconomiaAnual(detalheMensal.unitAmount, detalheAnual.unitAmount);
      }
      // Divisões do valor real do Stripe (nunca um número inventado) só pra
      // deixar a percepção de custo mais concreta: quanto dá por mês no
      // anual e quanto dá por dia no mensal.
      if (detalheAnual) {
        precoAnualPorMes = formatarPrecoExibicao(Math.round(detalheAnual.unitAmount / 12), moeda);
      }
      if (detalheMensal) {
        precoMensalPorDia = formatarPrecoExibicao(Math.round(detalheMensal.unitAmount / 30), moeda);
      }
    }
  }

  return (
    <ResultadoClient
      precoMensal={precoMensal}
      precoAnual={precoAnual}
      percentualEconomiaAnual={percentualEconomiaAnual}
      precoAnualPorMes={precoAnualPorMes}
      precoMensalPorDia={precoMensalPorDia}
    />
  );
}
