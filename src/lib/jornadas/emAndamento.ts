export interface JornadaAtivaResumo {
  id: string;
  jornadaId: string;
  diasCompletados: number;
  atualizadaEm: string;
}

export function escolherJornadaAtivaMaisRecente(
  jornadasAtivas: JornadaAtivaResumo[]
): JornadaAtivaResumo | null {
  if (jornadasAtivas.length === 0) {
    return null;
  }
  return [...jornadasAtivas].sort(
    (a, b) => new Date(b.atualizadaEm).getTime() - new Date(a.atualizadaEm).getTime()
  )[0];
}

export function resolverHrefAtividadeDoDia(
  atividadeId: string | null,
  checkinHojeId: string | null
): string {
  if (!atividadeId) return '/jornadas';
  return checkinHojeId
    ? `/jornada-atividade/${atividadeId}?checkin=${checkinHojeId}`
    : '/checkin';
}
