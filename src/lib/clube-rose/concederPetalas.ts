import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TipoEventoPetalas } from '@/lib/supabase/types';

export async function concederPetalas(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  tipoEvento: TipoEventoPetalas,
  referenciaId: string,
  quantidade: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('conceder_petalas', {
      p_usuaria_id: usuariaId,
      p_tipo_evento: tipoEvento,
      p_referencia_id: referenciaId,
      p_quantidade: quantidade,
    });

    if (error) {
      console.error('Falha ao conceder Pétalas:', error);
      return null;
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    if (!resultado?.concedido) {
      return null;
    }

    return quantidade;
  } catch (erro) {
    console.error('Falha inesperada ao conceder Pétalas:', erro);
    return null;
  }
}
