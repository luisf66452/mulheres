import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { dataLocalISONoFuso } from '@/lib/push/timeWindow';
import { SUPPORT_EMAIL } from '@/lib/config/contato';

// Envia uma notificação de teste só para a própria usuária autenticada,
// nunca para outra pessoa — nada no corpo da requisição escolhe o
// destinatário, é sempre a sessão atual. Rate limit simples: no máximo uma
// notificação de teste por dia local por usuária, reaproveitando a mesma
// tabela de idempotência do cron (push_envios), em vez de criar
// infraestrutura nova só para isso.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticada.' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ erro: 'Notificações push ainda não estão disponíveis.' }, { status: 503 });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ erro: 'Não foi possível enviar a notificação agora.' }, { status: 500 });
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('fuso_horario')
    .eq('id', user.id)
    .single();

  const dataLocal = dataLocalISONoFuso(new Date(), perfil?.fuso_horario ?? 'America/Sao_Paulo');

  const { error: erroIdempotencia } = await adminClient
    .from('push_envios')
    .insert({ usuaria_id: user.id, tipo: 'teste', data_local: dataLocal });

  if (erroIdempotencia) {
    if (erroIdempotencia.code === '23505') {
      return NextResponse.json(
        { erro: 'Você já pediu uma notificação de teste hoje. Tente de novo amanhã.' },
        { status: 429 }
      );
    }
    console.error('[push/teste] falha ao registrar idempotência', { message: erroIdempotencia.message });
    return NextResponse.json({ erro: 'Não foi possível enviar a notificação agora.' }, { status: 500 });
  }

  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('usuaria_id', user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { erro: 'Nenhuma inscrição de notificação encontrada neste dispositivo.' },
      { status: 400 }
    );
  }

  webpush.setVapidDetails(
    `mailto:${SUPPORT_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let enviados = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'Rose',
          body: 'Esta é uma notificação de teste. Suas notificações estão funcionando.',
          url: '/perfil/notificacoes',
        })
      );
      enviados++;
    } catch (erroEnvio) {
      const statusCode = (erroEnvio as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  if (enviados === 0) {
    return NextResponse.json(
      { erro: 'Não foi possível entregar a notificação neste dispositivo. Tente ativar de novo.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, enviados });
}
