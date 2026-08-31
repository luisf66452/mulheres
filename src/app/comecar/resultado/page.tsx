import { obterStripe } from '@/lib/stripe/client';
import {
  buscarPrecoDetalhado,
  calcularPercentualEconomiaAnual,
  obterMoedaELocaleDoPais,
  obterPriceId,
  stripeConfigurado,
} from '@/lib/stripe/planos';
import ResultadoClient from './ResultadoClient';

// Ainda não existe conta/país confirmado nesta etapa do funil (é pré-login)
// — usa BRL como padrão. O preço final por país é confirmado depois, em
// /perfil/assinatura, já com a conta criada.
export default async function ComecarResultadoPage() {
  let precoMensal: string | null = null;
  let precoAnual: string | null = null;
  let percentualEconomiaAnual: number | null = null;

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
    }
  }

  return (
    <ResultadoClient precoMensal={precoMensal} precoAnual={precoAnual} percentualEconomiaAnual={percentualEconomiaAnual} />
  );
}
