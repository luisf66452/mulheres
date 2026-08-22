import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { estaNaJanelaDeEnvio, diaDaSemanaNoFuso } from '@/lib/push/timeWindow';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:rosewomand123@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const agora = new Date();

  const { data: perfis } = await supabaseAdmin
    .from('perfis')
    .select('id, horario_preferido_notificacao, fuso_horario')
    .not('horario_preferido_notificacao', 'is', null);

  // Janela e dia da semana calculados no fuso de CADA usuária (não um único
  // horário/dia global do servidor) — essenciais pra respeitar o horário que
  // ela escolheu de verdade, e pra "dias da semana" bater com o calendário
  // dela perto da virada da meia-noite local.
  const candidatos = (perfis ?? []).filter((p) =>
    estaNaJanelaDeEnvio(p.horario_preferido_notificacao, agora, p.fuso_horario)
  );

  const { data: preferencias } = await supabaseAdmin
    .from('preferencias_notificacoes')
    .select('usuaria_id, lembrete_checkin, dias_semana')
    .in('usuaria_id', candidatos.map((c) => c.id));

  const preferenciaPorUsuaria = new Map((preferencias ?? []).map((p) => [p.usuaria_id, p]));

  // Sem linha em preferencias_notificacoes ainda = usuária nunca abriu essa
  // tela — mantém o padrão (lembrete ligado, todos os dias) em vez de calar
  // silenciosamente quem nunca teve a chance de desligar.
  const elegiveis = candidatos.filter((c) => {
    const preferencia = preferenciaPorUsuaria.get(c.id);
    if (!preferencia) return true;
    return (
      preferencia.lembrete_checkin &&
      preferencia.dias_semana.includes(diaDaSemanaNoFuso(agora, c.fuso_horario))
    );
  });

  let enviados = 0;
  for (const perfil of elegiveis) {
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('usuaria_id', perfil.id);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: 'Rose',
            body: 'Seu momento de cuidado de hoje está te esperando.',
          })
        );
        enviados++;
      } catch {
        // subscription expirada/inválida: ignora silenciosamente neste MVP
      }
    }
  }

  return NextResponse.json({ enviados });
}
