import type { ResultadoConcessaoPetalas } from './concederPetalas';

export function agregarResultadosPetalas(
  resultados: ResultadoConcessaoPetalas[]
): { total: number; limiteGratuitoAtingido: boolean } {
  let total = 0;
  let limiteGratuitoAtingido = false;

  for (const resultado of resultados) {
    total += resultado.quantidade ?? 0;
    limiteGratuitoAtingido = limiteGratuitoAtingido || resultado.limiteGratuitoAtingido;
  }

  return { total, limiteGratuitoAtingido };
}
