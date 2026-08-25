// Busca práticas de áudio para exibição na listagem pública de /praticas.
// Lê sempre de public.praticas_catalogo (nunca da tabela base `praticas`):
// essa view é legível por qualquer usuária autenticada independente do
// plano, inclusive para praticas is_pro = true — a RLS da tabela base (ver
// migração 20260825060150_praticas_rls_is_pro.sql) nega a linha inteira pra
// free numa prática Pro, o que faria o áudio Pro nem aparecer como teaser na
// listagem se buscássemos da tabela base. A view não expõe `conteudo`,
// `audio_url` nem `transcricao` (protegidos) — só título/categoria/duração
// como teaser. O acesso real ao áudio (gate Pro + checagem de mídia
// completa) continua em /praticas/[id].
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PraticaCatalogo } from '@/lib/supabase/types';

export async function buscarPraticasAudioPublicadas(
  supabase: SupabaseClient<Database>
): Promise<PraticaCatalogo[]> {
  const { data, error } = await supabase
    .from('praticas_catalogo')
    .select('*')
    .eq('status', 'publicada')
    .eq('audio_status', 'publicada');

  if (error || !data) return [];
  return data;
}
