import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { endpoint, p256dh, auth } = await request.json();
  // User-Agent identifica o dispositivo/navegador pra usuária reconhecer
  // qual é qual na lista de "remover este dispositivo" — nunca usado pra
  // nada além de exibição (não é PII sensível, mas mesmo assim só vive nesta
  // tabela restrita por RLS à própria usuária + service role).
  const userAgent = request.headers.get('user-agent');

  await supabase.from('push_subscriptions').upsert(
    { usuaria_id: user.id, endpoint, p256dh, auth, user_agent: userAgent, atualizado_em: new Date().toISOString() },
    { onConflict: 'endpoint' }
  );

  return NextResponse.json({ ok: true });
}

// Remove um dispositivo (inscrição push) da própria usuária — "remover este
// dispositivo" na tela de configurações. RLS já restringe a própria linha,
// mas o filtro explícito por usuaria_id evita depender só disso.
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { id } = await request.json();
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
  }

  await supabase.from('push_subscriptions').delete().eq('id', id).eq('usuaria_id', user.id);

  return NextResponse.json({ ok: true });
}
