import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import JornadaAtividadeClient from './JornadaAtividadeClient';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';
import { validarModuloEstruturado } from '@/lib/jornadas-modulos/validarModulo';
import type { ModuloEstruturadoV1, RespostaModuloV1 } from '@/lib/jornadas-modulos/tipos';

export default async function JornadaAtividadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkin?: string; petalas?: string; limitePetalas?: string }>;
}) {
  const { id } = await params;
  const { checkin, petalas, limitePetalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const mostrarLimiteAtingido = limitePetalas === '1';
  const supabase = await createSupabaseServerClient();

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('*')
    .eq('id', id)
    .single();

  if (!atividade || !checkin) {
    notFound();
  }

  // Módulo estruturado (novo formato) x atividade de texto livre (formato
  // original, ver AntesDepoisAtividade) — atividades antigas continuam
  // funcionando exatamente como antes porque conteudo_estruturado é nulo nelas.
  let moduloEstruturado: ModuloEstruturadoV1 | null = null;
  let jornadaUsuarioId: string | null = null;
  let respostaInicial: RespostaModuloV1 | null = null;

  if (atividade.conteudo_estruturado) {
    try {
      moduloEstruturado = validarModuloEstruturado(atividade.conteudo_estruturado);
    } catch (erro) {
      console.error('conteudo_estruturado inválido para atividade', atividade.id, erro);
      moduloEstruturado = null;
    }
  }

  if (moduloEstruturado) {
    const { data: jornadaUsuaria } = await supabase
      .from('jornadas_usuarias')
      .select('id')
      .eq('jornada_id', atividade.jornada_id)
      .maybeSingle();

    if (!jornadaUsuaria) {
      notFound();
    }
    jornadaUsuarioId = jornadaUsuaria.id;

    const { data: respostaSalva } = await supabase
      .from('jornada_respostas_modulo')
      .select('respostas')
      .eq('atividade_id', atividade.id)
      .maybeSingle();

    if (respostaSalva?.respostas && typeof respostaSalva.respostas === 'object') {
      respostaInicial = respostaSalva.respostas as RespostaModuloV1;
    }
  }

  return (
    <>
      {mostrarLimiteAtingido ? (
        <NotificacaoLimitePetalas />
      ) : (
        petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />
      )}
      <JornadaAtividadeClient
        atividade={atividade}
        checkinId={checkin}
        moduloEstruturado={moduloEstruturado}
        jornadaUsuarioId={jornadaUsuarioId}
        respostaInicial={respostaInicial}
      />
    </>
  );
}
