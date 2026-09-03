import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { obterStripe } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Único lugar do app que promove/rebaixa perfis.plano — nunca o frontend,
// nunca a rota de checkout. Só processa eventos com assinatura verificada
// (garante que vieram do Stripe de verdade) e registra cada evento em
// stripe_eventos_processados (migração 0019) para fins de auditoria — mas
// uma reentrega duplicada AINDA é reprocessada abaixo, porque os handlers
// fazem updates idempotentes e reprocessar corrige falhas de uma entrega
// anterior (ex.: um update de perfil que tinha falhado sem ser detectado).
export async function POST(request: Request) {
  const stripe = obterStripe();
  const segredoWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !segredoWebhook) {
    return NextResponse.json({ erro: 'Webhook não configurado.' }, { status: 503 });
  }

  const assinatura = request.headers.get('stripe-signature');
  if (!assinatura) {
    return NextResponse.json({ erro: 'Assinatura ausente.' }, { status: 400 });
  }

  const corpoBruto = await request.text();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(corpoBruto, assinatura, segredoWebhook);
  } catch (erro) {
    console.error('[stripe/webhook] assinatura inválida:', erro);
    return NextResponse.json({ erro: 'Assinatura inválida.' }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }

  const { error: erroIdempotencia } = await adminClient
    .from('stripe_eventos_processados')
    .insert({ id: evento.id, tipo: evento.type });

  let duplicado = false;
  if (erroIdempotencia) {
    if (erroIdempotencia.code === '23505') {
      // Evento já registrado antes (reentrega do Stripe). Não interrompe o
      // processamento — os handlers abaixo fazem updates idempotentes.
      duplicado = true;
    } else {
      console.error('[stripe/webhook] falha ao registrar idempotência:', erroIdempotencia);
      return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
    }
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const session = evento.data.object as Stripe.Checkout.Session;
        const usuariaId = session.metadata?.usuaria_id ?? session.client_reference_id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!customerId) {
          throw new Error('[stripe/webhook] checkout.session.completed sem customerId no evento.');
        }

        // Compra avulsa sem conta vinculada (ex.: order bump da assinatura
        // no checkout do ebook, que não exige login — ver
        // /api/stripe/checkout-ebook). Não há perfil pra atualizar; ativar o
        // Pro pra essa pessoa hoje é manual (metadata.origem = 'ebook_bump'
        // identifica essas vendas no painel do Stripe).
        if (!usuariaId) {
          break;
        }

        // Vincula customer/subscription sempre. Só promove a plano 'premium' aqui
        // se o pagamento já está confirmado (payment_status === 'paid') — com
        // meios de pagamento assíncronos (ex.: boleto) este evento chega com a
        // assinatura ainda 'incomplete' e sem pagamento efetivado; nesse caso
        // quem promove o plano é customer.subscription.updated, quando o Stripe
        // confirma a cobrança. Sem essa checagem, a usuária ganharia acesso Pro
        // antes do pagamento ser garantido.
        const pagamentoConfirmado = session.payment_status === 'paid';

        const { data: atualizado, error: erroUpdate } = await adminClient
          .from('perfis')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId ?? null,
            ...(pagamentoConfirmado ? { plano: 'premium' as const, assinatura_status: 'active' } : {}),
          })
          .eq('id', usuariaId)
          .select('id');

        if (erroUpdate) {
          throw new Error(
            `[stripe/webhook] falha ao atualizar perfil em checkout.session.completed: ${erroUpdate.message}`
          );
        }
        if (!atualizado || atualizado.length === 0) {
          throw new Error(
            '[stripe/webhook] checkout.session.completed: nenhum perfil encontrado para a usuária.'
          );
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = evento.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        const statusAtivo = subscription.status === 'active' || subscription.status === 'trialing';
        const periodoFimUnix = subscription.items.data[0]?.current_period_end;

        const { data: atualizado, error: erroUpdate } = await adminClient
          .from('perfis')
          .update({
            stripe_subscription_id: subscription.id,
            assinatura_status: subscription.status,
            assinatura_periodo_fim: periodoFimUnix ? new Date(periodoFimUnix * 1000).toISOString() : null,
            plano: statusAtivo ? 'premium' : 'free',
          })
          .eq('stripe_customer_id', customerId)
          .select('id');

        if (erroUpdate) {
          throw new Error(`[stripe/webhook] falha ao atualizar perfil em ${evento.type}: ${erroUpdate.message}`);
        }
        if (!atualizado || atualizado.length === 0) {
          // Assinatura sem usuaria_id nos metadata nunca teve conta vinculada
          // (ex.: order bump do ebook) — não achar perfil é esperado, não é
          // falha. Com usuaria_id presente e mesmo assim sem perfil, é uma
          // divergência real de dados e continua lançando erro.
          if (!subscription.metadata?.usuaria_id) {
            break;
          }
          throw new Error(`[stripe/webhook] ${evento.type}: nenhum perfil encontrado para o customer.`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = evento.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        const { data: atualizado, error: erroUpdate } = await adminClient
          .from('perfis')
          .update({
            plano: 'free',
            assinatura_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId)
          .select('id');

        if (erroUpdate) {
          throw new Error(`[stripe/webhook] falha ao atualizar perfil em ${evento.type}: ${erroUpdate.message}`);
        }
        if (!atualizado || atualizado.length === 0) {
          // Mesmo raciocínio de customer.subscription.updated: assinatura
          // sem usuaria_id nunca teve perfil (ex.: bump do ebook cancelado).
          if (!subscription.metadata?.usuaria_id) {
            break;
          }
          throw new Error(`[stripe/webhook] ${evento.type}: nenhum perfil encontrado para o customer.`);
        }
        break;
      }

      default:
        // Outros eventos (invoice.*, payment_intent.* etc.) não mudam
        // plano/assinatura diretamente — o Stripe já retenta cobrança
        // automaticamente e reflete o resultado final em
        // customer.subscription.updated, que é o evento tratado acima.
        break;
    }
  } catch (erro) {
    console.error(`[stripe/webhook] falha ao processar evento ${evento.type}:`, erro);
    return NextResponse.json({ erro: 'Erro ao processar evento.' }, { status: 500 });
  }

  return NextResponse.json({ recebido: true, duplicado });
}
