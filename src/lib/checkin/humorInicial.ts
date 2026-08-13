import type { EstadoGeral } from '@/lib/supabase/types';

export type HumorInicial = 1 | 2 | 3 | 4 | 5;

// Escala da UI do seletor de humor inicial: 1 = melhor (Muito bem), 5 = pior
// (Muito mal). Isso é o OPOSTO da coluna persistida checkins.humor, gerada
// por derivarHumor em derivacoes.ts (5 = melhor, 1 = pior) — são escalas
// intencionalmente diferentes que só compartilham o nome "humor", não um bug.
const QUADRANTE_POR_HUMOR: Record<HumorInicial, EstadoGeral> = {
  1: 'alta_energia_conforto',
  2: 'alta_energia_conforto',
  3: 'baixa_energia_conforto',
  4: 'baixa_energia_desconforto',
  5: 'baixa_energia_desconforto',
};

export function estadoInicialParaHumor(humor: HumorInicial): EstadoGeral {
  return QUADRANTE_POR_HUMOR[humor];
}

function ehHumorInicialValido(valor: number): valor is HumorInicial {
  return Number.isInteger(valor) && valor >= 1 && valor <= 5;
}

export function validarHumorParam(raw: string | string[] | undefined): HumorInicial | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  const valor = Number(raw);
  return ehHumorInicialValido(valor) ? valor : null;
}
