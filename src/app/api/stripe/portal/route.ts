import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { obterStripe } from '@/lib/stripe/client';
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

  const siteUrl = await obterUrlBaseDoRequest();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: perfil.stripe_customer_id,
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
