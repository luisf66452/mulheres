import type { Recomendacao } from './recommend';

export function decidirProximaEtapaCheckin(params: {
  recomendacao: Recomendacao;
  jornadaAtiva: { jornadaId: string; diasCompletados: number } | null;
  atividadeDoDiaExiste: boolean;
}): { tipo: 'seguranca' } | { tipo: 'jornada' } | { tipo: 'pratica' } {
  if (params.recomendacao.tipo === 'sinal_seguranca') {
    return { tipo: 'seguranca' };
  }

  if (params.jornadaAtiva && params.atividadeDoDiaExiste) {
    return { tipo: 'jornada' };
  }

  return { tipo: 'pratica' };
}
