import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Destino dedicado do magic link enviado por enviarConfirmacaoExclusao() —
// separado de /auth/callback de propósito, para não alterar o fluxo de
// login normal. Troca o code por uma sessão nova (prova de acesso recente
// ao e-mail) e só então libera a página com o botão final de exclusão.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const erroSupabase = searchParams.get('error_description');

  if (erroSupabase) {
    return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(erroSupabase)}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(error.message)}`);
    }

    return NextResponse.redirect(`${origin}/perfil/privacidade/confirmar-exclusao`);
  }

  return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent('Link de confirmação inválido.')}`);
}
