import { NextResponse } from 'next/server';
import { obterStripe } from '@/lib/stripe/client';
import { obterMoedaELocaleDoPais, obterPriceIdEbook } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session avulsa (mode: 'payment') para o ebook "Rose
// Reset 21 dias" — sem autenticação, sem Customer vinculado a conta,
// diferente de /api/stripe/checkout (assinatura, exige usuária logada). Não
// há país confirmado (sem perfil), então usa o fallback padrão de
// obterMoedaELocaleDoPais (Portugal/EUR) — o Stripe Checkout também detecta
// o país do cartão e pode ajustar a exibição por conta própria.
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Loja ainda não está disponível.' }, { status: 503 });
  }

  const priceId = obterPriceIdEbook();
  if (!priceId) {
    return NextResponse.json({ erro: 'O ebook ainda não está disponível.' }, { status: 503 });
  }

  const { locale } = obterMoedaELocaleDoPais(null);
  const siteUrl = await obterUrlBaseDoRequest();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
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
