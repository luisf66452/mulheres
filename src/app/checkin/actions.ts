'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { avaliarCheckin, type CheckinAnswers } from '@/lib/checkin/recommend';
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
