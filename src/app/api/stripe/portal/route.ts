import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';
import { obterCustomerValido } from '@/lib/stripe/customer';
import { obterUrlBaseDoRequest } from '@/lib/site-url';

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

  const { data: perfil } = await supabase.from('perfis').select('stripe_customer_id').eq('id', user.id).single();

  if (!perfil?.stripe_customer_id) {
    return NextResponse.json({ erro: 'Você ainda não tem uma assinatura para gerenciar.' }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ erro: 'Gerenciamento de assinatura ainda não está disponível.' }, { status: 503 });
  }

  try {
    let customerId = perfil.stripe_customer_id;

    // A conta Stripe pode ter sido trocada — se o id salvo pertence à conta
    // antiga (ou aponta para um Customer deletado), procura primeiro um
    // Customer da conta atual vinculado a esta usuária (metadata.usuaria_id)
    // antes de desistir. Uma assinatura válida nunca é tocada aqui.
    if (!(await obterCustomerValido(stripe, customerId))) {
      const encontrados = await stripe.customers.search({
        query: `metadata['usuaria_id']:'${user.id}'`,
        limit: 1,
      });
      const recuperado = encontrados.data[0];

      if (recuperado) {
        customerId = recuperado.id;
        const { error: erroUpdate } = await adminClient
          .from('perfis')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);

        if (erroUpdate) {
          console.error('[stripe/portal] falha ao atualizar stripe_customer_id recuperado', {
            message: erroUpdate.message,
          });
          return NextResponse.json(
            { erro: 'Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente.' },
            { status: 500 }
          );
        }
      } else {
        // Nenhum Customer válido nesta conta Stripe: normaliza o perfil para
        // free e limpa os IDs obsoletos, para não deixar a usuária presa em
        // um estado de assinatura que não existe mais na conta atual.
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
          { erro: 'Não encontramos uma assinatura ativa. Assine novamente para ter acesso ao Rose Pro.' },
          { status: 400 }
        );
      }
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
