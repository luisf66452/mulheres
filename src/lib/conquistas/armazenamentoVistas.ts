// Camada temporária baseada em localStorage — mesma justificativa de
// src/lib/praticas-progresso/armazenamento.ts: ainda não existe uma tabela
// própria no Supabase para marcar quais conquistas a usuária já viu
// celebrar. Quando existir, só este arquivo precisa ser trocado.
function chave(usuariaId: string): string {
  return `conquistas:vistas:${usuariaId}`;
}

export function obterVistas(usuariaId: string): Set<string> {
  try {
    const bruto = window.localStorage.getItem(chave(usuariaId));
    return new Set(bruto ? (JSON.parse(bruto) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function registrarVistas(usuariaId: string, idsDesbloqueadas: string[]): void {
  try {
    const atuais = obterVistas(usuariaId);
    idsDesbloqueadas.forEach((id) => atuais.add(id));
    window.localStorage.setItem(chave(usuariaId), JSON.stringify(Array.from(atuais)));
  } catch {
    // localStorage indisponível — a celebração pode repetir na próxima visita, mas o app não quebra
  }
}
