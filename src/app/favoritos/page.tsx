import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarSessaoEmQualquerJornada } from '@/lib/jornadas-conteudo/dados';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import Cartao from '@/app/components/Cartao';
import BotaoRemoverFavorito from './BotaoRemoverFavorito';
import CartaoFavoritoIndisponivel from './CartaoFavoritoIndisponivel';

export default async function FavoritosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Checagem sempre server-side: uma usuária free nunca deve receber o
  // `conteudo` de uma prática Pro na resposta, nem escondido via CSS — mesmo
  // padrão de gate usado em src/app/praticas/[id]/page.tsx.
  const { data: perfil } = await supabase.from('perfis').select('plano').eq('id', user.id).single();
  const plano: 'free' | 'premium' = perfil?.plano ?? 'free';

  const { data: favoritos } = await supabase
    .from('favoritos')
    .select('id, pratica_id, sessao_id, criado_em')
    .eq('usuaria_id', user.id)
    .order('criado_em', { ascending: false });

  const listaFavoritos = favoritos ?? [];
  const praticaIds = listaFavoritos
    .filter((f) => f.pratica_id !== null)
    .map((f) => f.pratica_id as string);

  const { data: praticas } =
    praticaIds.length > 0
      ? await supabase.from('praticas').select('id, titulo, conteudo, categoria, status, is_pro').in('id', praticaIds)
      : {
          data: [] as {
            id: string;
            titulo: string;
            conteudo: string;
            categoria: string;
            status: string;
            is_pro: boolean;
          }[],
        };

  const praticasPorId = new Map((praticas ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <h1 className="font-display text-2xl text-texto">Favoritos</h1>

      {listaFavoritos.length === 0 && (
        <p className="text-sm text-texto-suave">Você ainda não favoritou nenhuma prática ou sessão.</p>
      )}

      <div className="space-y-3">
        {listaFavoritos.map((favorito) => {
          if (favorito.pratica_id) {
            const pratica = praticasPorId.get(favorito.pratica_id);
            const disponivel = !!pratica && pratica.status === 'publicada';

            if (!disponivel) {
              return <CartaoFavoritoIndisponivel key={favorito.id} tipo="pratica" id={favorito.pratica_id} />;
            }

            // Nunca renderizar `conteudo` de uma prática Pro para quem não é
            // premium — nem parcialmente. O gate real de acesso já vive em
            // src/app/praticas/[id]/page.tsx; aqui só evitamos vazar o texto
            // na própria resposta de /favoritos.
            const bloqueada = pratica!.is_pro && plano !== 'premium';

            return (
              <Cartao key={favorito.id} className="flex items-center justify-between gap-3">
                <Link href={`/praticas/${pratica!.id}`} className="min-w-0 flex-1 space-y-1">
                  <p className="font-display text-base text-texto">{pratica!.titulo}</p>
                  {bloqueada ? (
                    <p className="text-sm font-medium text-destaque">Conteúdo Pro — toque para saber mais</p>
                  ) : (
                    <p className="line-clamp-2 text-sm text-texto-suave">{pratica!.conteudo}</p>
                  )}
                </Link>
                <BotaoRemoverFavorito tipo="pratica" id={pratica!.id} />
              </Cartao>
            );
          }

          const sessaoId = favorito.sessao_id as string;
          const encontrada = buscarSessaoEmQualquerJornada(sessaoId);

          if (!encontrada) {
            return <CartaoFavoritoIndisponivel key={favorito.id} tipo="sessao" id={sessaoId} />;
          }

          return (
            <Cartao key={favorito.id} className="flex items-center justify-between gap-3">
              <Link href={`/jornadas/${encontrada.jornada.slug}/${sessaoId}`} className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">{encontrada.jornada.titulo}</p>
                <p className="font-display text-base text-texto">{encontrada.sessao.titulo}</p>
                <p className="line-clamp-2 text-sm text-texto-suave">{encontrada.sessao.descricaoCurta}</p>
              </Link>
              <BotaoRemoverFavorito tipo="sessao" id={sessaoId} />
            </Cartao>
          );
        })}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
