import { NextResponse } from 'next/server';
import { obterStripe } from '@/lib/stripe/client';
import { obterMoedaELocaleDoPais, obterPriceIdEbook, obterUnitAmountNaMoeda } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session avulsa (mode: 'payment') para o ebook "Rose
// Reset 21 dias" — sem autenticação, sem Customer vinculado a conta,
// diferente de /api/stripe/checkout (assinatura, exige usuária logada). Não
// há país confirmado (sem perfil), então usa 'BR' como padrão — mesmo país
// que a página /ebook usa para exibir o preço (ver src/app/ebook/page.tsx) —
// e confirma com o Stripe que o Price realmente tem essa moeda antes de
// criar a sessão, para o valor exibido e o valor cobrado nunca divergirem.
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Loja ainda não está disponível.' }, { status: 503 });
  }

  const priceId = obterPriceIdEbook();
  if (!priceId) {
    return NextResponse.json({ erro: 'O ebook ainda não está disponível.' }, { status: 503 });
  }

  const { moeda, locale } = obterMoedaELocaleDoPais('BR');
  const siteUrl = await obterUrlBaseDoRequest();

  try {
    // Os Prices são multimoeda (currency_options) — confirma que o Price
    // realmente tem a moeda esperada ANTES de criar a sessão. Sem essa
    // checagem, um Price mal configurado (sem BRL) cairia na moeda default
    // do Price no Stripe, cobrando em uma moeda diferente da exibida em
    // /ebook silenciosamente (mesmo cuidado de /api/stripe/checkout).
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    if (unitAmount === null) {
      console.error('[stripe/checkout-ebook] price sem currency_options para a moeda esperada', {
        priceId,
        moeda,
      });
      return NextResponse.json({ erro: 'O ebook ainda não está disponível nessa moeda.' }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      currency: moeda,
      locale,
      success_url: `${siteUrl}/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/ebook`,
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a compra agora.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (erro) {
    console.error('[stripe/checkout-ebook] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json({ erro: 'Não foi possível iniciar a compra agora. Tente novamente.' }, { status: 500 });
  }
}
