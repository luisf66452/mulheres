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

  let corpo: { endpoint?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (typeof corpo.endpoint !== 'string' || !corpo.endpoint) {
    return NextResponse.json({ error: 'invalid endpoint' }, { status: 400 });
  }

  // RLS ("usuaria gerencia proprias subscriptions") já restringe o delete à
  // própria usuária — o filtro por usuaria_id aqui é defesa em profundidade,
  // não a única barreira.
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', corpo.endpoint)
    .eq('usuaria_id', user.id);

  if (error) {
    console.error('[push/desinscrever] falha ao remover inscrição', { message: error.message });
    return NextResponse.json({ error: 'failed to remove subscription' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
