// Ciclo respiratório fixo e confortável: inspire 4s, expire devagar 6s,
// repetido até completar os 3 minutos da prática de Respiração. Sem
// retenção do ar. `DURACAO_CICLO_S` (10s) divide os 180s totais em 18
// ciclos exatos, então o cronômetro nunca termina "no meio" de uma fase.

export const DURACAO_INSPIRAR_S = 4;
export const DURACAO_EXPIRAR_S = 6;
export const DURACAO_CICLO_S = DURACAO_INSPIRAR_S + DURACAO_EXPIRAR_S;

export type FaseRespiracao = 'inspire' | 'expire';

export interface EstadoCicloRespiracao {
  fase: FaseRespiracao;
  progressoFase: number;
}

export function calcularFaseRespiracao(segundosDecorridos: number): EstadoCicloRespiracao {
  const dentroDoCiclo = segundosDecorridos % DURACAO_CICLO_S;
  if (dentroDoCiclo < DURACAO_INSPIRAR_S) {
    return { fase: 'inspire', progressoFase: dentroDoCiclo / DURACAO_INSPIRAR_S };
  }
  return {
    fase: 'expire',
    progressoFase: (dentroDoCiclo - DURACAO_INSPIRAR_S) / DURACAO_EXPIRAR_S,
  };
}
