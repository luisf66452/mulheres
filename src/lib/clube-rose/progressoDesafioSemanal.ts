import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { formatDateISO } from '@/lib/date';
import { obterSegundaFeira } from '@/lib/progress/semana';
import { concederPetalas } from './concederPetalas';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DESAFIO_SEMANAL } from './desafioSemanal';

export function semanaInicioISO(agora: Date = new Date()): string {
  return formatDateISO(obterSegundaFeira(agora));
}

// Conta quantas sessões (práticas + atividades de jornada) a usuária concluiu
// na semana corrente (segunda a domingo). Calculado sob demanda — não há
// contador persistido, então nunca dessincroniza de "sessoes".
export async function contarEtapasDesafioSemanal(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  agora: Date = new Date()
): Promise<number> {
  const segunda = obterSegundaFeira(agora);
  const proximaSegunda = new Date(segunda);
  proximaSegunda.setDate(proximaSegunda.getDate() + 7);

  const { count } = await supabase
    .from('sessoes')
    .select('id', { count: 'exact', head: true })
    .eq('usuaria_id', usuariaId)
    .gte('criado_em', segunda.toISOString())
    .lt('criado_em', proximaSegunda.toISOString());

  return count ?? 0;
}

// Se a usuária já atingiu a meta da semana E ainda não resgatou a recompensa
// desta semana, registra o resgate (idempotente via constraint UNIQUE em
// resgates_desafio_semanal) e concede as Pétalas. Retorna null silenciosamente
// em qualquer outro caso (meta não atingida, já resgatado, ou erro) — nunca
// lança, para não interromper o fluxo de conclusão de prática/jornada que
// disparou esta checagem.
export async function concederDesafioSemanalSeElegivel(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<number | null> {
  const etapas = await contarEtapasDesafioSemanal(supabase, usuariaId);
  if (etapas < DESAFIO_SEMANAL.meta) {
    return null;
  }

  const { data: resgate, error } = await supabase
    .from('resgates_desafio_semanal')
    .insert({ usuaria_id: usuariaId, semana_inicio: semanaInicioISO() })
    .select('id')
    .single();

  if (error || !resgate) {
    return null;
  }

  return concederPetalas(
    createSupabaseAdminClient(),
    usuariaId,
    'desafio_semanal',
    resgate.id,
    DESAFIO_SEMANAL.recompensa
  );
}
