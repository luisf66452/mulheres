import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';
import { obterCustomerValido } from '@/lib/stripe/customer';
import { ehPlanoValido, obterMoedaELocaleDoPais, obterPriceId, obterUnitAmountNaMoeda } from '@/lib/stripe/planos';
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

  let corpo: { plano?: string; promo?: string };
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
    .select('stripe_customer_id, plano, pais')
    .eq('id', user.id)
    .single();

  if (perfil?.plano === 'premium') {
    return NextResponse.json({ erro: 'Você já é assinante Pro.' }, { status: 400 });
  }

  // A moeda vem sempre do país salvo no perfil (nunca de um campo do corpo
  // da requisição) — impede que o cliente escolha a própria moeda/preço.
  const { moeda, locale } = obterMoedaELocaleDoPais(perfil?.pais);

  try {
    let customerId = perfil?.stripe_customer_id ?? null;

    // A conta Stripe pode ter sido trocada — se o id salvo pertence à conta
    // antiga (ou aponta para um Customer deletado), trata como se a usuária
    // nunca tivesse tido um Customer, e recria abaixo. Uma assinatura válida
    // (customerId ok) nunca é tocada aqui.
    if (customerId && !(await obterCustomerValido(stripe, customerId))) {
      customerId = null;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { usuaria_id: user.id },
      });
      customerId = customer.id;
      // Só a service role grava stripe_customer_id (fora da lista de colunas
      // liberadas por 0012 para UPDATE do client). Limpa também dados de
      // assinatura antigos, que pertenciam ao Customer obsoleto/inexistente.
      const { error: erroUpdatePerfil } = await adminClient
        .from('perfis')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          assinatura_status: null,
          assinatura_periodo_fim: null,
        })
        .eq('id', user.id);

      if (erroUpdatePerfil) {
        console.error('[stripe/checkout] falha ao gravar stripe_customer_id no perfil', {
          message: erroUpdatePerfil.message,
        });
        return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora. Tente novamente.' }, { status: 500 });
      }
    }

    // Os Prices são multimoeda (currency_options) — confirma que o Price
    // realmente tem a moeda esperada para o país da usuária ANTES de criar a
    // sessão. Sem essa checagem, um Price mal configurado (sem BRL, por
    // exemplo) cairia na moeda default do Price no Stripe (normalmente EUR),
    // cobrando a usuária brasileira em euros silenciosamente.
    const price = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    const unitAmount = obterUnitAmountNaMoeda(price, moeda);
    if (unitAmount === null) {
      console.error('[stripe/checkout] price sem currency_options para a moeda esperada', {
        priceId,
        moeda,
      });
      return NextResponse.json({ erro: 'Este plano ainda não está disponível nessa moeda.' }, { status: 503 });
    }

    const siteUrl = await obterUrlBaseDoRequest();

    // O código promocional só chega até aqui via link próprio (?promo=...
    // repassado pela página de assinatura) — nunca um campo digitável pela
    // usuária no nosso app. Ainda assim, resolve contra o Stripe (em vez de
    // confiar num id vindo do corpo da requisição) para garantir que só um
    // Promotion Code realmente ativo é aplicado.
    let promotionCodeId: string | undefined;
    if (corpo.promo) {
      const promotionCodes = await stripe.promotionCodes.list({ code: corpo.promo, active: true, limit: 1 });
      promotionCodeId = promotionCodes.data[0]?.id;
    }

    // {CHECKOUT_SESSION_ID} é substituído pelo Stripe no redirect real — é o
    // id que a página de sucesso usa para confirmar com o Stripe (fonte de
    // verdade) que o pagamento foi mesmo efetivado, antes de reportar
    // Purchase ao TikTok Pixel (ver /api/stripe/confirmar-pagamento).
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      currency: moeda,
      locale,
      success_url: `${siteUrl}/perfil/assinatura?checkout=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/perfil/assinatura?checkout=cancelado`,
      client_reference_id: user.id,
      subscription_data: { metadata: { usuaria_id: user.id } },
      metadata: { usuaria_id: user.id },
      ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
    });

    if (!session.url) {
      return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora.' }, { status: 500 });
    }

    // Valor real cobrado na moeda que foi realmente usada na sessão (não um
    // valor fixo no app) — só para o front-end reportar o evento
    // InitiateCheckout do TikTok Pixel com o valor correto.
    const valor = unitAmount / 100;

    return NextResponse.json({ url: session.url, valor, moeda: moeda.toUpperCase() });
  } catch (erro) {
    console.error('[stripe/checkout] falha ao criar sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json({ erro: 'Não foi possível iniciar a assinatura agora. Tente novamente.' }, { status: 500 });
  }
}
