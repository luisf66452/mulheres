// Camada temporária baseada em localStorage — mesma justificativa de
// src/lib/praticas-progresso/armazenamento.ts: ainda não existe uma tabela
// própria no Supabase para preferências de conteúdo. Quando existir, só
// este arquivo precisa ser trocado.

export type Tema =
  | 'imagem_corporal'
  | 'autocompaixao'
  | 'comparacao'
  | 'alimentacao_emocional'
  | 'ansiedade_regulacao'
  | 'autoestima';

export type DuracaoPreferida = 'curta' | 'media' | 'longa';
export type HorarioUso = 'manha' | 'tarde' | 'noite';
export type TomLinguagem = 'acolhedor' | 'direto';

export interface PreferenciasUsuaria {
  temas: Tema[];
  objetivos: string[];
  tiposConteudo: string[];
  duracaoPreferida: DuracaoPreferida | null;
  horariosUso: HorarioUso[];
  tom: TomLinguagem | null;
  temasCuidado: Tema[];
}

export const PREFERENCIAS_PADRAO: PreferenciasUsuaria = {
  temas: [],
  objetivos: [],
  tiposConteudo: [],
  duracaoPreferida: null,
  horariosUso: [],
  tom: null,
  temasCuidado: [],
};

function chave(usuariaId: string): string {
  return `perfil:preferencias:${usuariaId}`;
}

export function obterPreferencias(usuariaId: string): PreferenciasUsuaria {
  try {
    const bruto = window.localStorage.getItem(chave(usuariaId));
    if (!bruto) return PREFERENCIAS_PADRAO;
    return { ...PREFERENCIAS_PADRAO, ...(JSON.parse(bruto) as Partial<PreferenciasUsuaria>) };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

export function salvarPreferencias(usuariaId: string, preferencias: PreferenciasUsuaria): void {
  try {
    window.localStorage.setItem(chave(usuariaId), JSON.stringify(preferencias));
  } catch {
    // localStorage indisponível — a preferência não persiste nesta sessão, mas o app não quebra
  }
}
