import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buscarJornadaPorSlug, buscarSessaoPorId, listarSessoesEmOrdem } from '@/lib/jornadas-conteudo/dados';
import { calcularEstadosSessoes, carregarProgressoJornada, registrarInicioSessao } from '@/lib/jornadas-conteudo/progresso';
import SessaoClient from './SessaoClient';

export default async function SessaoJornadaPage({
  params,
}: {
  params: Promise<{ slug: string; sessaoId: string }>;
}) {
  const { slug, sessaoId } = await params;
  const jornada = buscarJornadaPorSlug(slug);
  const sessao = jornada ? buscarSessaoPorId(jornada, sessaoId) : undefined;

  if (!jornada || !sessao) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { concluidas, iniciadas } = await carregarProgressoJornada(supabase, user.id, jornada.slug);
  const sessaoIdsEmOrdem = listarSessoesEmOrdem(jornada).map((s) => s.id);
  const estados = calcularEstadosSessoes(sessaoIdsEmOrdem, concluidas, iniciadas);

  // Sessão bloqueada não pode ser aberta diretamente por URL, mesmo que a
  // usuária tente pular etapas — a mesma regra de "só a próxima sessão
  // disponível" vale independentemente de como se chega até aqui.
  if (estados[sessaoId] === 'bloqueada') {
    redirect(`/jornadas/${jornada.slug}`);
  }

  if (!concluidas.has(sessaoId)) {
    await registrarInicioSessao(supabase, user.id, jornada.slug, sessaoId);
  }

  return <SessaoClient jornadaSlug={jornada.slug} jornadaTitulo={jornada.titulo} sessao={sessao} />;
}
