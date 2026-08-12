import type { Recomendacao } from './recommend';
import type { ProximaAcaoEscolhida } from '@/lib/supabase/types';

export function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao;
  proximaAcaoEscolhida: ProximaAcaoEscolhida;
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'guardar' } | { tipo: 'jornada' } | { tipo: 'pratica' } {
  if (params.recomendacao.tipo === 'sinal_seguranca') {
    return { tipo: 'seguranca' };
  }

  if (params.proximaAcaoEscolhida === 'guardar') {
    return { tipo: 'guardar' };
  }

  if (params.jornadaAtiva && params.atividadeDoDiaExiste) {
    return { tipo: 'jornada' };
  }

  return { tipo: 'pratica' };
}
