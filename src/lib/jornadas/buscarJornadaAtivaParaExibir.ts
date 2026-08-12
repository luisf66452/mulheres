import type { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  escolherJornadaAtivaMaisRecente,
  resolverLinkAtividadeDoDia,
  type ResultadoLinkAtividade,
} from './emAndamento';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface JornadaAtivaParaExibir {
  jornadaId: string;
  titulo: string;
  descricao: string;
  duracaoDias: number;
  diasCompletados: number;
  emRevisao: boolean;
  linkAtividade: ResultadoLinkAtividade;
}

export async function buscarJornadaAtivaParaExibir(
  supabase: SupabaseServerClient,
  usuariaId: string,
  checkinHojeId: string | null
): Promise<JornadaAtivaParaExibir | null> {
  const { data: jornadasAtivas } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id, dias_completados, atualizada_em')
    .eq('usuaria_id', usuariaId)
    .eq('status', 'em_andamento');

  const jornadaAtivaMaisRecente = escolherJornadaAtivaMaisRecente(
    (jornadasAtivas ?? []).map((j) => ({
      id: j.id,
      jornadaId: j.jornada_id,
      diasCompletados: j.dias_completados,
      atualizadaEm: j.atualizada_em,
    }))
  );

  if (!jornadaAtivaMaisRecente) {
    return null;
  }

  const { data: jornada } = await supabase
    .from('jornadas')
    .select('titulo, descricao, duracao_dias')
    .eq('id', jornadaAtivaMaisRecente.jornadaId)
    .single();

  if (!jornada) {
    return null;
  }

  const emRevisao = jornadaAtivaMaisRecente.diasCompletados >= jornada.duracao_dias;
  const numeroDiaParaBuscar = emRevisao ? 1 : jornadaAtivaMaisRecente.diasCompletados + 1;

  const { data: atividadeDoDia } = await supabase
    .from('jornada_atividades')
    .select('id')
    .eq('jornada_id', jornadaAtivaMaisRecente.jornadaId)
    .eq('numero_dia', numeroDiaParaBuscar)
    .maybeSingle();

  return {
    jornadaId: jornadaAtivaMaisRecente.jornadaId,
    titulo: jornada.titulo,
    descricao: jornada.descricao,
    duracaoDias: jornada.duracao_dias,
    diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
    emRevisao,
    linkAtividade: resolverLinkAtividadeDoDia(atividadeDoDia?.id ?? null, checkinHojeId),
  };
}
