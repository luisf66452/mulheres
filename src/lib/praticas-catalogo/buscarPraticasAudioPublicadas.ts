// Busca práticas de áudio prontas para exibição pública: publicadas tanto
// no texto (status) quanto no áudio (audio_status), com toda a mídia
// presente. Decisão de visibilidade fica aqui na camada de aplicação —
// nunca em constraint de banco (ver Seção 6 do design).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Pratica } from '@/lib/supabase/types';

export async function buscarPraticasAudioPublicadas(
  supabase: SupabaseClient<Database>
): Promise<Pratica[]> {
  const { data, error } = await supabase
    .from('praticas')
    .select('*')
    .eq('status', 'publicada')
    .eq('audio_status', 'publicada')
    .not('audio_url', 'is', null)
    .not('duracao_segundos', 'is', null)
    .not('transcricao', 'is', null);

  if (error || !data) return [];
  return data;
}
