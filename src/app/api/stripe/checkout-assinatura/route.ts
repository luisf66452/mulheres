import { NextResponse } from 'next/server';
import { obterStripe } from '@/lib/stripe/client';
import { obterMoedaELocaleDoPais, obterPriceId, obterUnitAmountNaMoeda } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session de assinatura (mode: 'subscription') sem
// autenticação, para a landing pública /assinatura (tráfego de anúncio que
// já quer assinar direto, sem passar pelo quiz/login antes). Diferente de
// /api/stripe/checkout (exige usuária logada, cria Customer vinculado à
// conta): aqui não existe conta ainda — o Stripe Checkout coleta o e-mail
// nativamente e o webhook cria a conta depois do pagamento confirmado (ver
// /api/stripe/webhook, metadata.origem === 'assinatura_landing').
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const priceId = obterPriceId('mensal');
  if (!priceId) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const { moeda, locale } = obterMoedaELocaleDoPais('BR');
  const siteUrl = await obterUrlBaseDoRequest();

  try {
    // Os Prices são multimoeda (currency_options) — confirma que o Price
    // realmente tem a moeda esperada ANTES de criar a sessão, mesmo cuidado
    // de /api/stripe/checkout e /api/stripe/checkout-ebook.
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    if (unitAmount === null) {
      console.error('[stripe/checkout-assinatura] price sem currency_options para a moeda esperada', {
        priceId,
        moeda,
      });
      return NextResponse.json({ erro: 'Assinatura ainda não está disponível nessa moeda.' }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      currency: moeda,
      locale,
      success_url: `${siteUrl}/assinatura/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/assinatura`,
      metadata: { origem: 'assinatura_landing' },
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (erro) {
    console.error('[stripe/checkout-assinatura] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json(
      { erro: 'Não foi possível iniciar a assinatura agora. Tente novamente.' },
      { status: 500 }
    );
  }
}
