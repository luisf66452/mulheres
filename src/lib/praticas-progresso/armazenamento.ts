// Registro de conclusão das práticas rápidas (Respiração, Meditação, Diário
// guiado, Autocompaixão), persistido em conclusoes_praticas_conteudo
// (migração 0018). Recebe o client Supabase por injeção (mesmo padrão de
// concederPetalas) em vez de criar um internamente — mantém a função testável
// sem depender de localStorage/globals de navegador.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { ConclusaoPratica } from './tipos';

const JANELA_IDEMPOTENCIA_MS = 5000;

export async function registrarConclusao(
  supabase: SupabaseClient<Database>,
  conclusao: ConclusaoPratica
): Promise<void> {
  const instante = new Date(conclusao.concluidaEm).getTime();
  const desde = new Date(instante - JANELA_IDEMPOTENCIA_MS).toISOString();
  const ate = new Date(instante + JANELA_IDEMPOTENCIA_MS).toISOString();

  // Evita duplicata de duplo toque/reenvio: mesma prática, mesma usuária,
  // dentro de uma janela curta de tempo em torno do instante informado.
  const { data: recentes } = await supabase
    .from('conclusoes_praticas_conteudo')
    .select('id')
    .eq('usuaria_id', conclusao.usuariaId)
    .eq('pratica_id', conclusao.praticaId)
    .gte('concluida_em', desde)
    .lte('concluida_em', ate)
    .limit(1);

  if (recentes && recentes.length > 0) return;

  await supabase.from('conclusoes_praticas_conteudo').insert({
    usuaria_id: conclusao.usuariaId,
    pratica_id: conclusao.praticaId,
    concluida_em: conclusao.concluidaEm,
    duracao_minutos: conclusao.duracaoMinutos,
  });
}

export async function listarTodasConclusoes(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<ConclusaoPratica[]> {
  const { data } = await supabase
    .from('conclusoes_praticas_conteudo')
    .select('pratica_id, usuaria_id, concluida_em, duracao_minutos')
    .eq('usuaria_id', usuariaId);

  return (data ?? []).map((linha) => ({
    praticaId: linha.pratica_id,
    usuariaId: linha.usuaria_id,
    concluidaEm: linha.concluida_em,
    duracaoMinutos: linha.duracao_minutos,
  }));
}
