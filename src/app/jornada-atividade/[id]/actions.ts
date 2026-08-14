'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgressoJornada } from '@/lib/jornadas/progresso';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { ehPrimeiraConclusao } from '@/lib/clube-rose/primeiraConclusao';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';

export async function registrarSessaoJornada(params: {
  checkinId: string;
  jornadaAtividadeId: string;
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
    .eq('jornada_atividade_id', params.jornadaAtividadeId);

  const primeiraConclusaoAtividade = ehPrimeiraConclusao(sessoesAnteriores);

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .insert({
      checkin_id: params.checkinId,
      usuaria_id: user.id,
      pratica_id: null,
      jornada_atividade_id: params.jornadaAtividadeId,
      sensacao_antes: params.sensacaoAntes,
      sensacao_depois: params.sensacaoDepois,
    })
    .select('id')
    .single();

  // Se a inserção falhar por violação da constraint sessoes_checkin_unico (ex: uma
  // segunda requisição concorrente pro mesmo check-in), não avança o progresso de
  // novo — essa sessão já foi registrada antes. Redireciona igual ao caminho de
  // sucesso. Qualquer outro erro (RLS, FK, rede) é um problema real e não deve ser
  // tratado como sucesso.
  if (error) {
    if (error.code === '23505') {
      redirect('/progresso');
    }
    throw new Error('Não foi possível registrar a atividade. Tente novamente.');
  }

  const { data: atividade } = await supabase
    .from('jornada_atividades')
    .select('jornada_id')
    .eq('id', params.jornadaAtividadeId)
    .single();

  if (!atividade) {
    redirect('/progresso');
  }

  const { data: jornada } = await supabase
    .from('jornadas')
    .select('duracao_dias')
    .eq('id', atividade.jornada_id)
    .single();

  const { data: progresso } = await supabase
    .from('jornadas_usuarias')
    .select('id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('jornada_id', atividade.jornada_id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  let totalPetalas = 0;

  if (sessao && primeiraConclusaoAtividade) {
    const petalasAtividade = await concederPetalas(
      supabase,
      user.id,
      'sessao_jornada_primeira_conclusao',
      sessao.id,
      VALORES_PETALAS.sessaoJornadaPrimeiraConclusao
    );
    totalPetalas += petalasAtividade ?? 0;
  }

  if (jornada && progresso) {
    const { novoDiasCompletados, jornadaConcluida } = calcularProgressoJornada(
      progresso.dias_completados,
      jornada.duracao_dias
    );

    await supabase
      .from('jornadas_usuarias')
      .update({
        dias_completados: novoDiasCompletados,
        status: jornadaConcluida ? 'concluida' : 'em_andamento',
        ...(jornadaConcluida ? { concluida_em: new Date().toISOString() } : {}),
      })
      .eq('id', progresso.id);

    if (jornadaConcluida) {
      const petalasJornada = await concederPetalas(
        supabase,
        user.id,
        'jornada_completa',
        progresso.id,
        VALORES_PETALAS.jornadaCompleta
      );
      totalPetalas += petalasJornada ?? 0;
    }
  }

  redirect(totalPetalas > 0 ? `/progresso?petalas=${totalPetalas}` : '/progresso');
}
