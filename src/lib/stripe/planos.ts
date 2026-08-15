// IDs de preço reais do Stripe (painel do Stripe, não hardcoded em valor de
// R$ — quem define o preço é o Stripe, o app só referencia o price id).
export type PlanoStripe = 'mensal' | 'anual';

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
