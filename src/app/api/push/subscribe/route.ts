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

  await supabase.from('push_subscriptions').upsert(
    { usuaria_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  );

  return NextResponse.json({ ok: true });
}
