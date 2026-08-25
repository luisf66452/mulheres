import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarJornadaPorSlug, buscarSessaoPorId, listarSessoesEmOrdem } from '@/lib/jornadas-conteudo/dados';
import { calcularEstadosSessoes, carregarProgressoJornada, registrarInicioSessao } from '@/lib/jornadas-conteudo/progresso';
import SessaoClient from './SessaoClient';
import { concluirSessao } from './actions';

export default async function SessaoJornadaPage({
  params,
}: {
  params: Promise<{ slug: string; sessaoId: string }>;
}) {
  const { slug, sessaoId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const jornada = buscarJornadaPorSlug(slug);
  const resultado = jornada ? buscarSessaoPorId(slug, sessaoId) : undefined;

  if (!jornada || !resultado) {
    notFound();
  }

  const { sessao, modulo } = resultado;

  const { data: favoritoExistente } = await supabase
    .from('favoritos')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('sessao_id', sessaoId)
    .maybeSingle();
  const favoritado = !!favoritoExistente;

  let estados: ReturnType<typeof calcularEstadosSessoes>;
  try {
    const progresso = await carregarProgressoJornada(supabase, user.id, jornada.slug);
    estados = calcularEstadosSessoes(jornada, progresso);
  } catch {
    // Sem progresso confiável não dá para saber se esta sessão está
    // liberada — falha fechada e manda para a página da jornada em vez de
    // arriscar mostrar uma sessão que deveria estar bloqueada.
    redirect(`/jornadas/${jornada.slug}`);
  }

  // Uma sessão bloqueada não pode ser aberta diretamente por URL, mesmo que
  // a usuária tente pular etapas — a mesma regra de "só a próxima sessão
  // disponível" vale independentemente de como se chega até aqui. Falha
  // fechada: um estado ausente/inesperado é tratado como bloqueado, não
  // como liberado (mesma postura de `jornadas/[slug]/page.tsx`, que usa
  // `estados[sessao.id] ?? 'bloqueada'`).
  const estadoSessaoAtual = estados[sessaoId] ?? 'bloqueada';
  if (estadoSessaoAtual === 'bloqueada') {
    redirect(`/jornadas/${jornada.slug}`);
  }

  try {
    await registrarInicioSessao(supabase, user.id, jornada.slug, sessaoId);
  } catch (erro) {
    // Falha ao registrar o início não deve impedir a renderização da
    // sessão — a usuária ainda pode fazer a prática mesmo que o registro de
    // progresso falhe. Nunca logar conteúdo psicoeducativo/reflexão, só o
    // fato de que o registro falhou.
    console.error('Falha ao registrar início de sessão de jornada:', erro);
  }

  const sessoesEmOrdem = listarSessoesEmOrdem(jornada);
  const indiceAtual = sessoesEmOrdem.findIndex((s) => s.id === sessaoId);
  const proximaSessao = indiceAtual >= 0 ? sessoesEmOrdem[indiceAtual + 1] : undefined;
  const proximaSessaoHref = proximaSessao ? `/jornadas/${jornada.slug}/${proximaSessao.id}` : null;

  return (
    <SessaoClient
      sessao={sessao}
      modulo={modulo}
      jornadaSlug={jornada.slug}
      jornadaTitulo={jornada.titulo}
      proximaSessaoHref={proximaSessaoHref}
      favoritado={favoritado}
      onConcluir={concluirSessao.bind(null, jornada.slug, sessao.id)}
    />
  );
}
