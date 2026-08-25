// Chave de localStorage usada para persistir rascunhos de práticas guiadas
// (diário guiado, autocompaixão, e qualquer futura categoria com texto
// recuperável) por usuária e por dia. Centralizada aqui para os 3 lugares que
// precisam montar a MESMA chave (quem grava via usePersistedState e quem só
// lê para saber se existe rascunho a retomar) nunca divergirem.
export function chaveRascunhoPratica(categoria: string, usuariaId: string, data: string): string {
  return `praticas:${categoria}:${usuariaId}:${data}`;
}
