import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ROTAS_PUBLICAS = [
  '/login',
  '/auth/callback',
  '/privacidade',
  '/api/stripe/webhook',
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRotaPublica = ROTAS_PUBLICAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (!user && !isRotaPublica) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && !isRotaPublica && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('consentimento_dados_sensiveis_em')
      .eq('id', user.id)
      .single();

    if (!perfil?.consentimento_dados_sensiveis_em) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
};
