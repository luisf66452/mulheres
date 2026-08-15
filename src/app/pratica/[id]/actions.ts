'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { ehPrimeiraConclusao } from '@/lib/clube-rose/primeiraConclusao';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { concederDesafioSemanalSeElegivel } from '@/lib/clube-rose/progressoDesafioSemanal';

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

  let totalPetalas = 0;
  if (primeiraConclusao) {
    // referencia_id é o id da prática (estável), não o da sessão recém-criada:
    // duas requisições concorrentes para a mesma prática (ex.: duas abas, cada
    // uma com seu próprio check-in) criam sessões com ids diferentes, então
    // usar sessao.id como chave de idempotência não bloquearia a corrida. Como
    // "primeira conclusão" é um evento por (usuária, prática), a chave de
    // idempotência precisa refletir isso.
    const petalasPratica = await concederPetalas(
      createSupabaseAdminClient(),
      user.id,
      'pratica_primeira_conclusao',
      params.praticaId,
      VALORES_PETALAS.praticaPrimeiraConclusao
    );
    totalPetalas += petalasPratica ?? 0;
  }

  const petalasDesafio = await concederDesafioSemanalSeElegivel(supabase, user.id);
  totalPetalas += petalasDesafio ?? 0;

  redirect(totalPetalas > 0 ? `/progresso?petalas=${totalPetalas}` : '/progresso');
}
