'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { avaliarCheckin, type CheckinAnswers } from '@/lib/checkin/recommend';
import { decidirProximaEtapaCheckin } from '@/lib/checkin/roteamento';
import { formatDateISO } from '@/lib/date';

export async function submeterCheckin(answers: CheckinAnswers) {
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

  const { data: regras } = await supabase
    .from('regras_recomendacao')
    .select('*')
    .eq('ativa', true);

  const recomendacao = avaliarCheckin(answers, regras ?? []);

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      usuaria_id: user.id,
      data: hojeISO,
      humor: answers.humor,
      imagem_corporal: answers.imagemCorporal,
      comida: answers.comida,
      texto_livre: answers.textoLivre ?? null,
      sinal_seguranca: recomendacao.tipo === 'sinal_seguranca',
    })
    .select()
    .single();

  if (error || !checkin) {
    throw new Error('Não foi possível salvar o check-in. Tente novamente.');
  }

  if (recomendacao.tipo === 'sinal_seguranca') {
    redirect('/seguranca');
  }

  // A partir daqui, recomendacao.tipo é 'pratica'.

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
