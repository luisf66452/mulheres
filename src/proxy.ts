import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ROTAS_PUBLICAS = [
  '/login',
  '/auth/callback',
  '/privacidade',
  '/api/stripe/webhook',
  // Quiz pré-cadastro (/comecar e /comecar/resultado, cobertos pelo
  // startsWith abaixo) — acessado sempre sem sessão, é o novo primeiro
  // contato do funil de anúncio, antes de existir conta (ver spec
  // 2026-08-31-funil-quiz-pre-cadastro-design.md).
  '/comecar',
  // Destino do magic link de confirmação de exclusão de conta (Tarefa 10):
  // é acessado sem sessão válida sempre que a usuária abre o e-mail num
  // dispositivo/navegador diferente do que está logada, ou depois que a
  // sessão original expirou — exatamente o caso que este link existe para
  // resolver. Bloquear aqui faria o middleware redirecionar para /login
  // antes da rota trocar o código pela sessão, quebrando a exclusão em
  // silêncio. A rota em si já valida o código com o Supabase; não abre
  // nenhum acesso além do que um login normal já concede.
  '/api/perfil/confirmar-exclusao',
  // Funil de venda avulsa do ebook (/ebook e /ebook/obrigado, cobertos pelo
  // startsWith abaixo, mais a API de checkout que ambos acionam): compra
  // deliberadamente sem conta (ver spec 2026-09-02-funil-ebook-design.md) —
  // bloquear aqui redirecionaria qualquer visitante sem sessão para /login
  // antes mesmo de ver a oferta, quebrando o funil inteiro pra exatamente o
  // público que ele existe para atender.
  '/ebook',
  '/api/stripe/checkout-ebook',
  // Chamado pelo Vercel Cron (ver vercel.json), nunca por uma usuária
  // logada no navegador — não existe sessão Supabase nessa requisição, então
  // bloquear aqui redirecionaria toda execução do cron para /login antes de
  // a rota conseguir sequer checar o header `Authorization: Bearer
  // CRON_SECRET` (a autenticação de verdade, feita dentro da própria rota).
  // Mesma justificativa do webhook do Stripe acima.
  '/api/push/send-due',
  // O espaço "Preciso de ajuda agora" (Seção 7 do design de evolução da
  // Rose) precisa funcionar mesmo sem sessão e mesmo para quem ainda não
  // completou o onboarding — quem está buscando ajuda agora não pode ficar
  // preso a um redirect de login ou de confirmação de país. A própria
  // página (src/app/seguranca/page.tsx) já lida com os dois casos (sem
  // usuária, ou usuária sem país confirmado) mostrando a seleção manual de
  // país em vez de dados que ainda não existem.
  '/seguranca',
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
      .select('consentimento_dados_sensiveis_em, pais_confirmado_em')
      .eq('id', user.id)
      .single();

    // Mesmo gate para as duas condições: sem consentimento OU sem país
    // confirmado, a usuária vai para /onboarding — que decide sozinho qual
    // etapa mostrar. Isso cobre tanto contas novas quanto contas que já
    // completaram o onboarding antes de pais_confirmado_em existir.
    if (!perfil?.consentimento_dados_sensiveis_em || !perfil?.pais_confirmado_em) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
};
