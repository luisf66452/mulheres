import Stripe from 'stripe';

let instancia: Stripe | null | undefined;

// Mesmo padrão de createSupabaseAdminClient: retorna null (em vez de lançar)
// quando a chave não está configurada, para que rotas/páginas possam
// degradar de forma honesta ("assinatura ainda não disponível") em vez de
// quebrar o build ou o app quando STRIPE_SECRET_KEY não existe (dev local,
// preview sem Stripe configurado etc.).
export function obterStripe(): Stripe | null {
  if (instancia !== undefined) return instancia;

  const chaveSecreta = process.env.STRIPE_SECRET_KEY;
  if (!chaveSecreta) {
    instancia = null;
    return null;
  }

  instancia = new Stripe(chaveSecreta);
  return instancia;
}
