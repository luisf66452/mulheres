import { formatDateISO } from '@/lib/date';

export const ROTULO_HUMOR: Record<number, string> = {
  1: 'Muito baixo',
  2: 'Baixo',
  3: 'Bem',
  4: 'Alto',
  5: 'Muito alto',
};

export interface DiaSemana {
  data: string; // YYYY-MM-DD
  humor: number | null;
}

export function obterSegundaFeira(data: Date): Date {
  const copia = new Date(data);
  const diaSemana = copia.getDay(); // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  copia.setDate(copia.getDate() + deslocamento);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

export function calcularSemana(
  checkins: { data: string; humor: number }[],
  segundaFeiraISO: string
): DiaSemana[] {
  const humorPorData = new Map(checkins.map((c) => [c.data, c.humor]));
  const inicio = new Date(`${segundaFeiraISO}T00:00:00`);

  const dias: DiaSemana[] = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const data = formatDateISO(dia);
    dias.push({ data, humor: humorPorData.get(data) ?? null });
  }
  return dias;
}

export function semanaAnteriorISO(segundaFeiraISO: string): string {
  const data = new Date(`${segundaFeiraISO}T00:00:00`);
  data.setDate(data.getDate() - 7);
  return formatDateISO(data);
}

export function semanaSeguinteISO(segundaFeiraISO: string, hoje: Date): string | null {
  const segundaAtualISO = formatDateISO(obterSegundaFeira(hoje));
  if (segundaFeiraISO >= segundaAtualISO) {
    return null;
  }
  const data = new Date(`${segundaFeiraISO}T00:00:00`);
  data.setDate(data.getDate() + 7);
  return formatDateISO(data);
}

export function resolverSegundaFeira(parametro: string | undefined, hoje: Date): string {
  const segundaAtualISO = formatDateISO(obterSegundaFeira(hoje));
  if (!parametro || !/^\d{4}-\d{2}-\d{2}$/.test(parametro)) {
    return segundaAtualISO;
  }
  const dataParametro = new Date(`${parametro}T00:00:00`);
  if (Number.isNaN(dataParametro.getTime())) {
    return segundaAtualISO;
  }
  const segundaValidadaISO = formatDateISO(obterSegundaFeira(dataParametro));
  return segundaValidadaISO > segundaAtualISO ? segundaAtualISO : segundaValidadaISO;
}
