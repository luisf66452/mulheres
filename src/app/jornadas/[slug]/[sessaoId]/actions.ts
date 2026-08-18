'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buscarJornadaPorSlug, buscarSessaoPorId } from '@/lib/jornadas-conteudo/dados';
import { registrarConclusaoSessao } from '@/lib/jornadas-conteudo/progresso';
import { idPetalasParaSessao } from '@/lib/jornadas-conteudo/idPetalas';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';
import { montarSufixoPetalas } from '@/lib/clube-rose/montarSufixoPetalas';

export async function concluirSessaoJornadaConteudo(jornadaSlug: string, sessaoId: string) {
  const jornada = buscarJornadaPorSlug(jornadaSlug);
  const sessao = jornada ? buscarSessaoPorId(jornada, sessaoId) : undefined;

  if (!jornada || !sessao) {
    redirect('/jornadas');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { concluidaAgora } = await registrarConclusaoSessao(supabase, user.id, jornadaSlug, sessaoId);

  let sufixoPetalas = '';
  if (concluidaAgora) {
    // Mesma origem de Pétalas do modelo de jornada mais antigo
    // ('sessao_jornada_primeira_conclusao') — é semanticamente o mesmo
    // evento (primeira conclusão de uma sessão de jornada), só que o
    // referencia_id aqui é um uuid determinístico derivado do id de texto
    // da sessão (ver idPetalasParaSessao) em vez de um uuid de banco.
    const resultado = await concederPetalas(
      createSupabaseAdminClient(),
      user.id,
      'sessao_jornada_primeira_conclusao',
      idPetalasParaSessao(sessaoId),
      VALORES_PETALAS.sessaoJornadaPrimeiraConclusao
    );
    sufixoPetalas = montarSufixoPetalas({
      total: resultado.quantidade ?? 0,
      limiteGratuitoAtingido: resultado.limiteGratuitoAtingido,
    });
  }

  redirect(`/jornadas/${jornadaSlug}${sufixoPetalas}`);
}
