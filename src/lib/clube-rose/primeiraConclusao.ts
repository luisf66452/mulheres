export function ehPrimeiraConclusao(sessoesAnteriores: unknown[] | null | undefined): boolean {
  return (sessoesAnteriores ?? []).length === 0;
}
