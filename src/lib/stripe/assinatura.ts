import type Stripe from 'stripe';

const STATUS_ATIVOS = new Set(['active', 'trialing']);

function ehStatusAtivo(status: Stripe.Subscription.Status): boolean {
  return STATUS_ATIVOS.has(status);
}

export async function obterAssinaturaAtivaDoCustomer(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription | null> {
  const assinaturas = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
  return assinaturas.data.find((assinatura) => ehStatusAtivo(assinatura.status)) ?? null;
}

// Um Customer existir na conta Stripe atual não significa que a usuária
// tenha uma assinatura válida (ex.: Customer duplicado sem cobrança, ou
// assinatura cancelada) — por isso a busca por metadata.usuaria_id sempre
// confirma uma assinatura active/trialing antes de considerar recuperado.
export async function encontrarAssinaturaAtivaPorUsuaria(
  stripe: Stripe,
  usuariaId: string
): Promise<{ customer: Stripe.Customer; subscription: Stripe.Subscription } | null> {
  const encontrados = await stripe.customers.search({
    query: `metadata['usuaria_id']:'${usuariaId}'`,
    limit: 10,
  });

  for (const customer of encontrados.data) {
    const assinatura = await obterAssinaturaAtivaDoCustomer(stripe, customer.id);
    if (assinatura) return { customer, subscription: assinatura };
  }

  return null;
}
