import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function ehTextoNaoVazio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  let corpo: { endpoint?: unknown; p256dh?: unknown; auth?: unknown; fusoHorario?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { endpoint, p256dh, auth, fusoHorario } = corpo;

  if (!ehTextoNaoVazio(endpoint) || !endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'invalid endpoint' }, { status: 400 });
  }
  if (!ehTextoNaoVazio(p256dh) || !ehTextoNaoVazio(auth)) {
    return NextResponse.json({ error: 'invalid keys' }, { status: 400 });
  }

  const { error: erroInscricao } = await supabase
    .from('push_subscriptions')
    .upsert({ usuaria_id: user.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' });

  if (erroInscricao) {
    console.error('[push/subscribe] falha ao salvar inscrição', { message: erroInscricao.message });
    return NextResponse.json({ error: 'failed to save subscription' }, { status: 500 });
  }

  // Melhor esforço: se o fuso vier vazio/ausente (navegador sem suporte a
  // Intl, chamada antiga) a inscrição de push continua válida — só o cálculo
  // de horário do cron fica menos preciso para essa usuária até ela salvar
  // de novo.
  if (ehTextoNaoVazio(fusoHorario)) {
    const { error: erroFuso } = await supabase
      .from('perfis')
      .update({ fuso_horario: fusoHorario })
      .eq('id', user.id);
    if (erroFuso) {
      console.error('[push/subscribe] falha ao salvar fuso horário', { message: erroFuso.message });
    }
  }

  return NextResponse.json({ ok: true });
}
