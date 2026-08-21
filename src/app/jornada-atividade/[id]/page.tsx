import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { estaEmPreviewVercel } from '@/lib/supabase/previewOnly';
import { notFound } from 'next/navigation';
import JornadaAtividadeClient from './JornadaAtividadeClient';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';
import { validarModuloEstruturado } from '@/lib/jornadas-modulos/validarModulo';
import type { ModuloEstruturadoV1, RespostaModuloV1 } from '@/lib/jornadas-modulos/tipos';
import type { JornadaAtividade } from '@/lib/supabase/types';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  let atividade: JornadaAtividade | null = null;
  const { data: atividadePublicada } = await supabase
    .from('jornada_atividades')
    .select('*')
    .eq('id', id)
    .single();
  atividade = atividadePublicada;

  // Só em deployments de Preview da Vercel (VERCEL_ENV, nunca controlável por
  // uma requisição), se a atividade não apareceu pela leitura normal (RLS só
  // libera jornadas com status='publicada'), tenta de novo com a service
  // role — permite testar conteúdo em rascunho antes da validação da
  // psicóloga, sem nunca abrir esse caminho em Production. A usuária
  // continua precisando de sessão válida (checado acima); isto só amplia
  // QUAIS LINHAS são lidas, nunca quem pode ler.
  if (!atividade && estaEmPreviewVercel()) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const { data: atividadeRascunho } = await admin
        .from('jornada_atividades')
        .select('*')
        .eq('id', id)
        .single();
      atividade = atividadeRascunho;
    }
  }

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
