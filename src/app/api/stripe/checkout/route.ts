import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';
import { ehPlanoValido, obterPriceId } from '@/lib/stripe/planos';

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/perfil/assinatura?checkout=sucesso`,
    cancel_url: `${siteUrl}/perfil/assinatura?checkout=cancelado`,
    client_reference_id: user.id,
    subscription_data: { metadata: { usuaria_id: user.id } },
    metadata: { usuaria_id: user.id },
  });

  if (!session.url) {
    return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
