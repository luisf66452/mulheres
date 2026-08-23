import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';
import { obterCustomerValido } from '@/lib/stripe/customer';
import { obterAssinaturaAtivaDoCustomer, encontrarAssinaturaAtivaPorUsuaria } from '@/lib/stripe/assinatura';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

function camposDaAssinaturaRecuperada(customerId: string, subscription: Stripe.Subscription) {
  const periodoFimUnix = subscription.items.data[0]?.current_period_end;
  return {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    assinatura_status: subscription.status,
    assinatura_periodo_fim: periodoFimUnix ? new Date(periodoFimUnix * 1000).toISOString() : null,
    plano: 'premium' as const,
  };
}

// Abre o Billing Portal do Stripe (gerenciado pelo próprio Stripe) para a
// usuária cancelar ou trocar de plano — não reimplementamos gestão de
// assinatura no app; o Stripe já cobre isso com segurança/UX corretos.
export async function POST() {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Gerenciamento de assinatura ainda não está disponível.' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticada.' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('plano, stripe_customer_id, stripe_subscription_id, assinatura_status, assinatura_periodo_fim')
    .eq('id', user.id)
    .single();

  // perfil.plano é a fonte de estado local, mas pode ter ficado dessincronizada
  // da Stripe (ex.: troca de conta Stripe, falha de webhook) — por isso, se a
  // usuária é premium OU já teve um customer_id, sempre tentamos validar/
  // recuperar contra a Stripe abaixo. Só desiste sem tocar em nada quando a
  // conta é genuinamente free e nunca teve nenhum vínculo com o Stripe.
  if (perfil?.plano !== 'premium' && !perfil?.stripe_customer_id) {
    return NextResponse.json({ erro: 'Você ainda não tem uma assinatura para gerenciar.' }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ erro: 'Gerenciamento de assinatura ainda não está disponível.' }, { status: 503 });
  }

  try {
    let customerId = perfil?.stripe_customer_id ?? null;
    let assinaturaConfirmada: Stripe.Subscription | null = null;

    if (customerId) {
      const customerValido = await obterCustomerValido(stripe, customerId);
      if (customerValido) {
        // O Customer existir não basta: também precisa ter uma assinatura
        // active/trialing na conta Stripe atual (não uma cancelada, nem um
        // Customer duplicado sem cobrança nenhuma).
        assinaturaConfirmada = await obterAssinaturaAtivaDoCustomer(stripe, customerId);
      }
    }

    if (!assinaturaConfirmada) {
      const recuperado = await encontrarAssinaturaAtivaPorUsuaria(stripe, user.id);

      if (recuperado) {
        customerId = recuperado.customer.id;
        assinaturaConfirmada = recuperado.subscription;

        const { error: erroUpdate } = await adminClient
          .from('perfis')
          .update(camposDaAssinaturaRecuperada(customerId, assinaturaConfirmada))
          .eq('id', user.id);

        if (erroUpdate) {
          console.error('[stripe/portal] falha ao atualizar assinatura recuperada no perfil', {
            message: erroUpdate.message,
          });
          return NextResponse.json(
            { erro: 'Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente.' },
            { status: 500 }
          );
        }
      } else {
        // Nenhuma assinatura ativa nesta conta Stripe: normaliza o perfil
        // para free e limpa os IDs obsoletos, para não deixar a usuária
        // presa num estado "premium" que não existe mais na Stripe atual.
        const { error: erroUpdate } = await adminClient
          .from('perfis')
          .update({
            plano: 'free',
            stripe_customer_id: null,
            stripe_subscription_id: null,
            assinatura_status: null,
            assinatura_periodo_fim: null,
          })
          .eq('id', user.id);

        if (erroUpdate) {
          console.error('[stripe/portal] falha ao normalizar perfil sem assinatura válida', {
            message: erroUpdate.message,
          });
        }

        return NextResponse.json(
          {
            erro: 'Não encontramos uma assinatura ativa. Assine novamente para ter acesso ao Rose Pro.',
            perfilAtualizado: true,
          },
          { status: 400 }
        );
      }
    }

    if (!customerId) {
      // Inalcançável: os dois ramos acima ou definem customerId, ou
      // retornam antes de chegar aqui. Guarda de tipo para o TypeScript.
      throw new Error('[stripe/portal] customerId inesperadamente nulo após validação.');
    }

    const siteUrl = await obterUrlBaseDoRequest();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/perfil/assinatura`,
    });

    return NextResponse.json({ url: session.url });
  } catch (erro) {
    console.error('[stripe/portal] falha ao criar sessão do portal de cobrança', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json(
      { erro: 'Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente.' },
      { status: 500 }
    );
  }
}
