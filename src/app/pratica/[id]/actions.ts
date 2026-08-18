'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import type { ResultadoConcessaoPetalas } from '@/lib/clube-rose/concederPetalas';
import { ehPrimeiraConclusao } from '@/lib/clube-rose/primeiraConclusao';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { concederDesafioSemanalSeElegivel } from '@/lib/clube-rose/progressoDesafioSemanal';
import { agregarResultadosPetalas } from '@/lib/clube-rose/agregarResultadosPetalas';
import { montarSufixoPetalas } from '@/lib/clube-rose/montarSufixoPetalas';

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

  // Se a inserção falhar por violação da constraint sessoes_checkin_unico (ex: uma
  // segunda requisição concorrente pro mesmo check-in), não trata como falha —
  // essa sessão já foi registrada antes (mesmo padrão de
  // jornada-atividade/[id]/actions.ts). Qualquer outro erro (RLS, FK, rede) é um
  // problema real e não deve ser tratado como sucesso.
  if (error && error.code === '23505') {
    redirect('/progresso');
  }

  if (error || !sessao) {
    throw new Error('Não foi possível registrar a sessão. Tente novamente.');
  }

  const resultados: ResultadoConcessaoPetalas[] = [];

  if (primeiraConclusao) {
    // referencia_id é o id da prática (estável), não o da sessão recém-criada:
    // duas requisições concorrentes para a mesma prática (ex.: duas abas, cada
    // uma com seu próprio check-in) criam sessões com ids diferentes, então
    // usar sessao.id como chave de idempotência não bloquearia a corrida. Como
    // "primeira conclusão" é um evento por (usuária, prática), a chave de
    // idempotência precisa refletir isso.
    resultados.push(
      await concederPetalas(
        createSupabaseAdminClient(),
        user.id,
        'pratica_primeira_conclusao',
        params.praticaId,
        VALORES_PETALAS.praticaPrimeiraConclusao
      )
    );
  }

  resultados.push(await concederDesafioSemanalSeElegivel(supabase, user.id));

  const { total: totalPetalas, limiteGratuitoAtingido } = agregarResultadosPetalas(resultados);
  const sufixoPetalas = montarSufixoPetalas({ total: totalPetalas, limiteGratuitoAtingido });

  redirect(sufixoPetalas ? `/progresso${sufixoPetalas}` : '/progresso');
}
