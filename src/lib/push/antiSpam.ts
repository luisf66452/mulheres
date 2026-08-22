// Limites de frequência aplicados a TODAS as notificações inteligentes
// combinadas (não por categoria) — ver brief: máx 2/dia, máx 8/semana,
// intervalo mínimo de 8h entre notificações. Puro: recebe só os timestamps
// de envios recentes da usuária (histórico), sem tocar o banco.

export const LIMITE_DIARIO = 2;
export const LIMITE_SEMANAL = 8;
export const INTERVALO_MINIMO_HORAS = 8;

const UMA_HORA_MS = 60 * 60 * 1000;
const UM_DIA_MS = 24 * UMA_HORA_MS;
const UMA_SEMANA_MS = 7 * UM_DIA_MS;

export interface AvaliacaoLimiteEnvio {
  podeEnviar: boolean;
  motivo?: 'limite_diario' | 'limite_semanal' | 'intervalo_minimo';
}

/**
 * `enviosRecentes` deve conter todo envio (de qualquer categoria) dos
 * últimos 7 dias, mais recente primeiro ou em qualquer ordem — a função
 * ordena internamente o que precisa.
 */
export function avaliarLimiteDeEnvio(agora: Date, enviosRecentes: Date[]): AvaliacaoLimiteEnvio {
  const agoraMs = agora.getTime();

  const naUltimaSemana = enviosRecentes.filter((d) => agoraMs - d.getTime() < UMA_SEMANA_MS);
  if (naUltimaSemana.length >= LIMITE_SEMANAL) {
    return { podeEnviar: false, motivo: 'limite_semanal' };
  }

  const noUltimoDia = naUltimaSemana.filter((d) => agoraMs - d.getTime() < UM_DIA_MS);
  if (noUltimoDia.length >= LIMITE_DIARIO) {
    return { podeEnviar: false, motivo: 'limite_diario' };
  }

  const maisRecente = naUltimaSemana.reduce<number | null>(
    (max, d) => (max === null || d.getTime() > max ? d.getTime() : max),
    null
  );
  if (maisRecente !== null && agoraMs - maisRecente < INTERVALO_MINIMO_HORAS * UMA_HORA_MS) {
    return { podeEnviar: false, motivo: 'intervalo_minimo' };
  }

  return { podeEnviar: true };
}
