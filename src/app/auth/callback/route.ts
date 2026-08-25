import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const erroSupabase = searchParams.get('error_description');

  if (erroSupabase) {
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent(erroSupabase)}`
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?erro=${encodeURIComponent(error.message)}`
      );
    }

    // O marcador é controlado por esta rota e usado apenas para apresentar
    // o convite ao Rose Pro uma vez, logo após um login bem-sucedido. Ao
    // dispensar ou abrir os planos, o componente remove o marcador da URL.
    return NextResponse.redirect(`${origin}/?entrada=1`);
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent('Link de acesso inválido.')}`
  );
}
