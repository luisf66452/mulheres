import Stripe from 'stripe';

// A conta Stripe pode ser trocada (ex.: migração de conta), deixando
// perfis.stripe_customer_id apontando para um Customer que só existe na
// conta antiga. Retorna null nesse caso (customer "obsoleto") para que quem
// chamar possa recuperar/recriar o Customer na conta atual — mas só nesse
// caso: qualquer outra falha da Stripe (rede, rate limit etc.) é propagada,
// para nunca apagar dados do perfil por causa de uma falha temporária.
export async function obterCustomerValido(stripe: Stripe, customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ('deleted' in customer && customer.deleted) return null;
    return customer;
  } catch (erro) {
    if (erro instanceof Stripe.errors.StripeError && erro.code === 'resource_missing') {
      return null;
    }
    throw erro;
  }
}
