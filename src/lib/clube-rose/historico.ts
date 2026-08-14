import type { TipoEventoPetalas } from '@/lib/supabase/types';
import { RECOMPENSAS } from './recompensas';

const ROTULOS: Record<Exclude<TipoEventoPetalas, 'resgate_recompensa'>, string> = {
  checkin_diario: 'Check-in emocional',
  pratica_primeira_conclusao: 'Prática concluída',
  sessao_jornada_primeira_conclusao: 'Sessão de jornada concluída',
  jornada_completa: 'Jornada concluída',
  desafio_semanal: 'Desafio semanal concluído',
};

// Para 'resgate_recompensa', o rótulo depende de qual recompensa foi
// resgatada — nomeRecompensa vem de um lookup à parte (ver HistoricoPetalas).
export function descreverTransacao(tipoEvento: TipoEventoPetalas, nomeRecompensa?: string | null): string {
  if (tipoEvento === 'resgate_recompensa') {
    return nomeRecompensa ? `${nomeRecompensa} resgatada` : 'Recompensa resgatada';
  }
  return ROTULOS[tipoEvento];
}

export function nomeRecompensaPorChave(chave: string): string | null {
  return RECOMPENSAS.find((r) => r.chave === chave)?.nome ?? null;
}
