import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { estaNaJanelaDeEnvio } from '@/lib/push/timeWindow';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:almeidaferreiraluisgustavo@gmail.com',
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
    .select('id, horario_preferido_notificacao')
    .not('horario_preferido_notificacao', 'is', null);

  const elegiveis = (perfis ?? []).filter((p) =>
    estaNaJanelaDeEnvio(p.horario_preferido_notificacao, agora)
  );

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
            title: 'Ritual Diário',
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
