import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TipoEventoPetalas } from '@/lib/supabase/types';

export interface ResultadoConcessaoPetalas {
  quantidade: number | null;
  limiteGratuitoAtingido: boolean;
}

const RESULTADO_NULO: ResultadoConcessaoPetalas = {
  quantidade: null,
  limiteGratuitoAtingido: false,
};

export async function concederPetalas(
  supabase: SupabaseClient<Database> | null,
  usuariaId: string,
  tipoEvento: TipoEventoPetalas,
  referenciaId: string,
  quantidade: number
): Promise<ResultadoConcessaoPetalas> {
  if (!supabase) {
    return RESULTADO_NULO;
  }

  try {
    const { data, error } = await supabase.rpc('conceder_petalas', {
      p_usuaria_id: usuariaId,
      p_tipo_evento: tipoEvento,
      p_referencia_id: referenciaId,
      p_quantidade: quantidade,
    });

    if (error) {
      console.error('Falha ao conceder Pétalas:', error);
      return RESULTADO_NULO;
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    if (!resultado?.concedido) {
      return {
        quantidade: null,
        limiteGratuitoAtingido: resultado?.limite_gratuito_atingido ?? false,
      };
    }

    return { quantidade, limiteGratuitoAtingido: false };
  } catch (erro) {
    console.error('Falha inesperada ao conceder Pétalas:', erro);
    return RESULTADO_NULO;
  }
}
