// Mesmos limites configurados no bucket "avatares" (0011_foto_perfil.sql) —
// validar aqui só evita um upload desnecessário; a garantia real é do bucket.
export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2MB

export function validarArquivoFoto(arquivo: { type: string; size: number }): string | null {
  if (!TIPOS_ACEITOS.includes(arquivo.type as (typeof TIPOS_ACEITOS)[number])) {
    return 'Escolha uma imagem JPG, PNG ou WEBP.';
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return 'A imagem precisa ter no máximo 2MB.';
  }
  return null;
}

export function extensaoPorTipo(tipo: string): string {
  if (tipo === 'image/png') return 'png';
  if (tipo === 'image/webp') return 'webp';
  return 'jpg';
}
