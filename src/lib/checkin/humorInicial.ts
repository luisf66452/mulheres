import type { EstadoGeral } from '@/lib/supabase/types';

export type HumorInicial = 1 | 2 | 3 | 4 | 5;

const QUADRANTE_POR_HUMOR: Record<HumorInicial, EstadoGeral> = {
  1: 'baixa_energia_desconforto',
  2: 'baixa_energia_desconforto',
  3: 'baixa_energia_conforto',
  4: 'alta_energia_conforto',
  5: 'alta_energia_conforto',
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
