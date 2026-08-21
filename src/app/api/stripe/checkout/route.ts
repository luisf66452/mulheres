import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';
import { ehPlanoValido, obterPriceId } from '@/lib/stripe/planos';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

// Cria uma Checkout Session do Stripe para a usuária autenticada assinar o
// Rose Pro. Nunca ativa o plano diretamente aqui — quem promove
// perfis.plano para 'premium' é sempre o webhook (checkout.session.completed
// / customer.subscription.updated), depois que o Stripe confirma o
// pagamento. Esta rota só inicia o checkout.
export async function POST(request: Request) {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticada.' }, { status: 401 });
  }

  let corpo: { plano?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!corpo.plano || !ehPlanoValido(corpo.plano)) {
    return NextResponse.json({ erro: 'Plano inválido.' }, { status: 400 });
  }

  const priceId = obterPriceId(corpo.plano);
  if (!priceId) {
    return NextResponse.json({ erro: 'Este plano ainda não está disponível.' }, { status: 503 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('stripe_customer_id, plano')
    .eq('id', user.id)
    .single();

  if (perfil?.plano === 'premium') {
    return NextResponse.json({ erro: 'Você já é assinante Pro.' }, { status: 400 });
  }

  try {
    let customerId = perfil?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { usuaria_id: user.id },
      });
      customerId = customer.id;
      // Só a service role grava stripe_customer_id (fora da lista de colunas
      // liberadas por 0012 para UPDATE do client).
      await adminClient.from('perfis').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const siteUrl = await obterUrlBaseDoRequest();

    // {CHECKOUT_SESSION_ID} é substituído pelo Stripe no redirect real — é o
    // id que a página de sucesso usa para confirmar com o Stripe (fonte de
    // verdade) que o pagamento foi mesmo efetivado, antes de reportar
    // Purchase ao TikTok Pixel (ver /api/stripe/confirmar-pagamento).
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/perfil/assinatura?checkout=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/perfil/assinatura?checkout=cancelado`,
      client_reference_id: user.id,
      subscription_data: { metadata: { usuaria_id: user.id } },
      metadata: { usuaria_id: user.id },
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
    }

    // Valor/moeda reais do price do Stripe (não um valor fixo no app) — só
    // para o front-end reportar o evento InitiateCheckout do TikTok Pixel
    // com o valor correto da assinatura que está realmente sendo iniciada.
    const price = await stripe.prices.retrieve(priceId);
    const valor = typeof price.unit_amount === 'number' ? price.unit_amount / 100 : null;
    const moeda = price.currency ? price.currency.toUpperCase() : null;

    return NextResponse.json({ url: session.url, valor, moeda });
  } catch (erro) {
    console.error('[stripe/checkout] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora. Tente novamente.' }, { status: 500 });
  }
}
