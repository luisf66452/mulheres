export function calcularProgressoJornada(
  diasCompletados: number,
  duracaoDias: number
): { novoDiasCompletados: number; jornadaConcluida: boolean } {
  const novoDiasCompletados = Math.min(diasCompletados + 1, duracaoDias);
  return {
    novoDiasCompletados,
    jornadaConcluida: novoDiasCompletados >= duracaoDias,
  };
}
