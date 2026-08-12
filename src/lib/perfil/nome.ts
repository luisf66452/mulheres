export function normalizarNome(bruto: string): string | null {
  const limpo = bruto.trim();
  return limpo.length > 0 ? limpo : null;
}
