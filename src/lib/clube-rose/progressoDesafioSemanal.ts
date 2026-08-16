import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { formatDateISO } from '@/lib/date';
import { obterSegundaFeira } from '@/lib/progress/semana';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DESAFIO_SEMANAL } from './desafioSemanal';
import type { ResultadoConcessaoPetalas } from './concederPetalas';

const RESULTADO_NULO: ResultadoConcessaoPetalas = {
  quantidade: null,
  limiteGratuitoAtingido: false,
};

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

// Se a usuária já atingiu a meta da semana, concede a recompensa do desafio
// via RPC service_role que registra o resgate E credita as Pétalas na MESMA
// transação (nunca um sem o outro — ver conceder_desafio_semanal em
// 0009_clube_rose_desafio_semanal.sql). Idempotente pela constraint UNIQUE em
// resgates_desafio_semanal: retorna null silenciosamente em qualquer caso que
// não seja a primeira concessão da semana, ou em erro — nunca lança, para não
// interromper o fluxo de conclusão de prática/jornada que disparou esta
// checagem.
export async function concederDesafioSemanalSeElegivel(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<ResultadoConcessaoPetalas> {
  const etapas = await contarEtapasDesafioSemanal(supabase, usuariaId);
  if (etapas < DESAFIO_SEMANAL.meta) {
    return RESULTADO_NULO;
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return RESULTADO_NULO;
  }

  try {
    const { data, error } = await adminClient.rpc('conceder_desafio_semanal', {
      p_usuaria_id: usuariaId,
      p_semana_inicio: semanaInicioISO(),
      p_quantidade: DESAFIO_SEMANAL.recompensa,
    });

    if (error) {
      console.error('Falha ao conceder desafio semanal:', error);
      return RESULTADO_NULO;
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    if (!resultado?.concedido) {
      return {
        quantidade: null,
        limiteGratuitoAtingido: resultado?.limite_gratuito_atingido ?? false,
      };
    }

    return { quantidade: DESAFIO_SEMANAL.recompensa, limiteGratuitoAtingido: false };
  } catch (erro) {
    console.error('Falha inesperada ao conceder desafio semanal:', erro);
    return RESULTADO_NULO;
  }
}
