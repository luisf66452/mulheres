'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { ehPrimeiraConclusao } from '@/lib/clube-rose/primeiraConclusao';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';

export async function registrarSessao(params: {
  checkinId: string;
  praticaId: string;
  sensacaoAntes: number;
  sensacaoDepois: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sessoesAnteriores } = await supabase
    .from('sessoes')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('pratica_id', params.praticaId);

  const primeiraConclusao = ehPrimeiraConclusao(sessoesAnteriores);

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .insert({
      checkin_id: params.checkinId,
      usuaria_id: user.id,
      pratica_id: params.praticaId,
      jornada_atividade_id: null,
      sensacao_antes: params.sensacaoAntes,
      sensacao_depois: params.sensacaoDepois,
    })
    .select('id')
    .single();

  if (error || !sessao) {
    throw new Error('Não foi possível registrar a sessão. Tente novamente.');
  }

  let petalasGanhas: number | null = null;
  if (primeiraConclusao) {
    petalasGanhas = await concederPetalas(
      supabase,
      user.id,
      'pratica_primeira_conclusao',
      sessao.id,
      VALORES_PETALAS.praticaPrimeiraConclusao
    );
  }

  redirect(petalasGanhas ? `/progresso?petalas=${petalasGanhas}` : '/progresso');
}
