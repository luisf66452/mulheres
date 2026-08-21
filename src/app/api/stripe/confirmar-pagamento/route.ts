import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { obterStripe } from '@/lib/stripe/client';

// Fonte de verdade para o front-end saber se reporta Purchase ao TikTok
// Pixel: confirma direto no Stripe (não só pela navegação de volta do
// checkout) que a sessão pertence à usuária autenticada e que o pagamento
// foi mesmo efetivado, e devolve o valor/moeda reais cobrados. Quem promove
// perfis.plano continua sendo só o webhook (ver /api/stripe/webhook) — esta
// rota não altera nenhum dado, só confirma o pagamento para fins de
// tracking.
export async function GET(request: NextRequest) {
  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json({ erro: 'Assinatura ainda não está disponível.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ erro: 'session_id ausente.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticada.' }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Garante que a sessão pertence mesmo a quem está pedindo a confirmação
    // — sem isso, alguém poderia forjar um session_id de outra pessoa na URL
    // para inflar métricas de conversão.
    const usuariaId = session.metadata?.usuaria_id ?? session.client_reference_id;
    if (usuariaId !== user.id) {
      return NextResponse.json({ erro: 'Sessão não encontrada.' }, { status: 404 });
    }

    const confirmado = session.payment_status === 'paid';
    const valor = typeof session.amount_total === 'number' ? session.amount_total / 100 : null;
    const moeda = session.currency ? session.currency.toUpperCase() : null;

    return NextResponse.json({ confirmado, valor, moeda });
  } catch (erro) {
    console.error('[stripe/confirmar-pagamento] falha ao consultar sessão', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return NextResponse.json({ erro: 'Não foi possível confirmar o pagamento agora.' }, { status: 500 });
  }
}
