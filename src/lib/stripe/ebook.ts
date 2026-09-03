import type Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const NOME_ARQUIVO_EBOOK = 'rose-reset-21-dias.pdf';
const SEGUNDOS_EXPIRACAO_SIGNED_URL = 600; // 10 minutos

type ResultadoDownloadEbook = {
  confirmado: boolean;
  urlDownload: string | null;
  valor: number | null;
  moeda: string | null;
};

// Confirma no Stripe (fonte de verdade) que a Checkout Session foi paga e,
// se sim, gera uma signed URL de curta duração para o PDF no bucket privado
// 'ebooks'. Não há usuária/conta para checar posse da sessão — diferente de
// /api/stripe/confirmar-pagamento (funil de assinatura) — porque o
// session_id do Stripe já não é adivinhável, o que é prova de posse
// suficiente para este produto de baixo valor sem conta.
//
// valor/moeda vêm da própria sessão confirmada (nunca de um valor fixo no
// app) — usados só por /ebook/obrigado para reportar o evento Purchase ao
// Meta Pixel com o valor real cobrado.
export async function obterDownloadEbook(stripe: Stripe, sessionId: string): Promise<ResultadoDownloadEbook> {
  let confirmado: boolean;
  let valor: number | null = null;
  let moeda: string | null = null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    confirmado = session.payment_status === 'paid';
    valor = typeof session.amount_total === 'number' ? session.amount_total / 100 : null;
    moeda = session.currency ? session.currency.toUpperCase() : null;
  } catch (erro) {
    console.error('[stripe/ebook] falha ao consultar a sessão de checkout', {
      message: erro instanceof Error ? erro.message : 'erro desconhecido',
    });
    return { confirmado: false, urlDownload: null, valor: null, moeda: null };
  }

  if (!confirmado) {
    return { confirmado: false, urlDownload: null, valor: null, moeda: null };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    console.error('[stripe/ebook] admin client indisponível ao gerar signed url');
    return { confirmado: true, urlDownload: null, valor, moeda };
  }

  const { data, error } = await adminClient.storage
    .from('ebooks')
    .createSignedUrl(NOME_ARQUIVO_EBOOK, SEGUNDOS_EXPIRACAO_SIGNED_URL);

  if (error || !data) {
    console.error('[stripe/ebook] falha ao gerar signed url', {
      message: error instanceof Error ? error.message : String(error),
    });
    return { confirmado: true, urlDownload: null, valor, moeda };
  }

  return { confirmado: true, urlDownload: data.signedUrl, valor, moeda };
}
