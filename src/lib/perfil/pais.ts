// Lista de países com recursos de segurança cadastrados
// (public.recursos_seguranca) — mantenha em sincronia com o que existe lá.
// Extensível: adicionar um país aqui exige também seed de recursos_seguranca
// e atualizar a constraint perfis_pais_suportado (migração 0032).
export const PAISES_SUPORTADOS = ['PT', 'BR'] as const;
export type PaisSuportado = (typeof PAISES_SUPORTADOS)[number];

export const NOME_PAIS: Record<PaisSuportado, string> = {
  PT: 'Portugal',
  BR: 'Brasil',
};
