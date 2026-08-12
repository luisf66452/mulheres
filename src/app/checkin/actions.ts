'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { derivarHumor, derivarImagemCorporal, derivarComida } from '@/lib/checkin/derivacoes';
import { decidirRecomendacaoComProtecao } from '@/lib/checkin/recommend';
import { decidirProximaEtapaCheckin } from '@/lib/checkin/roteamento';
import { formatDateISO } from '@/lib/date';
import type { EstadoGeral, AlimentacaoPercebida, ProximaAcaoEscolhida } from '@/lib/supabase/types';

export interface CheckinCompletoAnswers {
  estadoGeral: EstadoGeral;
  emocaoEspecifica: string;
  intensidade: number;
  confortoCorporal: number;
  gatilhoLocal: string | null;
  gatilhoPensamento: string | null;
  gatilhoEmocaoDepois: string | null;
  alimentacaoPercebida: AlimentacaoPercebida;
  fatores: string[];
  anotacao?: string;
  proximaAcao: ProximaAcaoEscolhida;
}

export async function submeterCheckin(
  answers: CheckinCompletoAnswers
): Promise<{ tipo: 'guardado' } | void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hojeISO = formatDateISO(new Date());

  const { data: checkinExistente } = await supabase
    .from('checkins')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('data', hojeISO)
    .maybeSingle();

  if (checkinExistente) {
    redirect('/progresso');
  }

  const humor = derivarHumor(answers.estadoGeral, answers.intensidade);
  const imagemCorporal = derivarImagemCorporal(answers.confortoCorporal);
  const comida = derivarComida(answers.alimentacaoPercebida);

  const { data: regras } = await supabase
    .from('regras_recomendacao')
    .select('*')
    .eq('ativa', true);

  const recomendacao = decidirRecomendacaoComProtecao(
    { humor, imagemCorporal, comida, alimentacaoPercebida: answers.alimentacaoPercebida },
    regras ?? []
  );

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      usuaria_id: user.id,
      data: hojeISO,
      humor,
      imagem_corporal: imagemCorporal,
      comida,
      texto_livre: answers.anotacao ?? null,
      sinal_seguranca: recomendacao.tipo === 'sinal_seguranca',
      estado_geral: answers.estadoGeral,
      emocao_especifica: answers.emocaoEspecifica,
      intensidade: answers.intensidade,
      alimentacao_percebida: answers.alimentacaoPercebida,
      gatilho_local: answers.gatilhoLocal,
      gatilho_pensamento: answers.gatilhoPensamento,
      gatilho_emocao_depois: answers.gatilhoEmocaoDepois,
      fatores: answers.fatores.length > 0 ? answers.fatores : null,
      proxima_acao: answers.proximaAcao,
    })
    .select()
    .single();

  if (error || !checkin) {
    throw new Error('Não foi possível salvar o check-in. Tente novamente.');
  }

  // A partir daqui, o check-in já está salvo no Supabase, independente da
  // saída escolhida (segurança, guardar, ou prática/jornada).

  if (recomendacao.tipo === 'sinal_seguranca') {
    redirect('/seguranca');
  }

  if (answers.proximaAcao === 'guardar') {
    return { tipo: 'guardado' };
  }

  const { data: jornadaAtivaRow } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  let atividadeDoDia: { id: string } | null = null;
  if (jornadaAtivaRow) {
    const { data } = await supabase
      .from('jornada_atividades')
      .select('id')
      .eq('jornada_id', jornadaAtivaRow.jornada_id)
      .eq('numero_dia', jornadaAtivaRow.dias_completados + 1)
      .maybeSingle();
    atividadeDoDia = data;
  }

  const etapa = decidirProximaEtapaCheckin({
    recomendacao,
    proximaAcaoEscolhida: answers.proximaAcao,
    jornadaAtiva: jornadaAtivaRow
      ? { jornadaId: jornadaAtivaRow.jornada_id, diasCompletados: jornadaAtivaRow.dias_completados }
      : null,
    atividadeDoDiaExiste: atividadeDoDia !== null,
  });

  if (etapa.tipo === 'jornada') {
    redirect(`/jornada-atividade/${atividadeDoDia!.id}?checkin=${checkin.id}`);
  }

  if (recomendacao.tipo !== 'pratica') {
    throw new Error('Estado inesperado: rota de prática escolhida sem categoria de recomendação.');
  }

  const { data: pratica } = await supabase
    .from('praticas')
    .select('id')
    .eq('categoria', recomendacao.categoria)
    .eq('status', 'publicada')
    .limit(1)
    .single();

  if (!pratica) {
    throw new Error(`Nenhuma prática publicada encontrada para a categoria "${recomendacao.categoria}"`);
  }

  redirect(`/pratica/${pratica.id}?checkin=${checkin.id}`);
}
