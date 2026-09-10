// Captura IP e User-Agent do navegador da cliente no momento da criação do
// checkout (Stripe) — é aqui, e só aqui, que o request chega direto do
// navegador dela; o webhook do Stripe (que dispara o evento na Conversions
// API — ver src/lib/meta/conversionsApi.ts) recebe requests dos servidores
// do Stripe, sem esses dados. Por isso os dois valores são gravados como
// metadata da Checkout Session em /api/stripe/checkout e
// /api/stripe/checkout-ebook, e lidos de volta no webhook.
//
// A Conversions API recusa (HTTP 400) qualquer evento sem nenhum dado de
// identificação do cliente — client_ip_address + client_user_agent é o
// mínimo aceito sem recorrer a PII como email/telefone (ver política de
// privacidade documentada em eventos.ts/conversionsApi.ts).
const LIMITE_TAMANHO_METADATA_STRIPE = 500;

export function obterDadosClienteParaMetadata(request: Request): {
  ip: string | undefined;
  userAgent: string | undefined;
} {
  const encaminhadoPor = request.headers.get('x-forwarded-for');
  const ip = encaminhadoPor?.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent')?.slice(0, LIMITE_TAMANHO_METADATA_STRIPE) || undefined;

  return { ip, userAgent };
}
