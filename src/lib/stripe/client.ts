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

  // Fixa a versão da API explicitamente: sem isso, trocar de versão da lib
  // stripe (ou de versão default configurada no dashboard) pode mudar o
  // formato dos eventos/objetos silenciosamente, sem nenhum controle de
  // versão no código.
  //
  // httpClient: createFetchHttpClient() — o cliente padrão da lib usa
  // https.Agent do Node com keep-alive, que em runtimes serverless (como as
  // functions da Vercel) pode reaproveitar um socket de uma instância fria
  // anterior já morto, causando "An error occurred with our connection to
  // Stripe" de forma consistente (não é uma falha passageira, se repete a
  // cada chamada). O cliente baseado em fetch não sofre desse problema.
  instancia = new Stripe(chaveSecreta, {
    apiVersion: '2026-07-29.dahlia',
    httpClient: Stripe.createFetchHttpClient(),
  });
  return instancia;
}
