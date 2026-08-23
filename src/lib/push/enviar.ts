// Envio de fato via web-push, compartilhado pelo cron (api/push/send-due) e
// pelo botão de notificação de teste (perfil/notificacoes). Mantido separado
// da geração de candidatos: aqui só existe I/O (rede + limpeza de
// subscription morta), nada de decisão de negócio.
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PushSubscriptionRow } from '@/lib/supabase/types';
import { deepLinkSeguro } from './deepLink';

export interface PayloadPush {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface ResultadoEnvioParaUsuaria {
  enviados: number;
  falhas: number;
}

let vapidConfigurado = false;

/** Idempotente: chamar mais de uma vez no mesmo processo não reconfigura à toa. */
export function garantirVapidConfigurado(): void {
  if (vapidConfigurado) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:rosewomand123@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidConfigurado = true;
}

/**
 * Envia o mesmo payload para todas as subscriptions (dispositivos) de uma
 * usuária. Uma subscription que o provedor rejeita com 404/410 (expirada/
 * revogada) é removida do banco imediatamente — nunca tentamos de novo pra
 * ela. Erros de outros tipos (rede, 5xx do provedor) só contam como falha,
 * sem apagar a subscription: podem ser transitórios.
 */
export async function enviarParaSubscricoes(
  supabaseAdmin: SupabaseClient<Database>,
  subscricoes: Pick<PushSubscriptionRow, 'id' | 'endpoint' | 'p256dh' | 'auth'>[],
  payload: PayloadPush
): Promise<ResultadoEnvioParaUsuaria> {
  garantirVapidConfigurado();

  const payloadSeguro: PayloadPush = { ...payload, url: deepLinkSeguro(payload.url) };
  const corpoSerializado = JSON.stringify(payloadSeguro);

  let enviados = 0;
  let falhas = 0;

  for (const sub of subscricoes) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        corpoSerializado
      );
      enviados++;
    } catch (erro) {
      falhas++;
      const statusCode = (erro as { statusCode?: number } | null)?.statusCode;
      // Nunca loga endpoint, chaves ou corpo do payload — só o status HTTP,
      // suficiente para diagnosticar (ex.: 401/403 = credenciais VAPID não
      // batem mais com a subscription, geralmente depois de trocar as
      // chaves; 404/410 tratado abaixo, removido de propósito).
      console.error(`[push] falha ao entregar (statusCode=${statusCode ?? 'desconhecido'})`);
      if (statusCode === 404 || statusCode === 410) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  return { enviados, falhas };
}
