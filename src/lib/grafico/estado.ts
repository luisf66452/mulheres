export type EstadoGrafico = 'sem_dados' | 'poucos_dados' | 'com_tendencia';

export function decidirEstadoGrafico(quantidadeCheckins: number): EstadoGrafico {
  if (quantidadeCheckins === 0) {
    return 'sem_dados';
  }
  if (quantidadeCheckins === 1) {
    return 'poucos_dados';
  }
  return 'com_tendencia';
}
