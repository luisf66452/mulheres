// Listas fechadas de objetivos e temas sensíveis do onboarding personalizado
// (design: docs/superpowers/specs/2026-08-24-evolucao-rose-design.md, seção 2).
// Gravadas em perfis.objetivos / perfis.temas_sensiveis (text[]) só via server
// action com admin client — ver src/app/onboarding/actions.ts. Nunca aceitar
// string arbitrária do cliente: toda escrita passa por validarObjetivos /
// validarTemasSensiveis primeiro.

export const OBJETIVOS = [
  { id: 'fortalecer_autoestima', rotulo: 'Fortalecer minha autoestima' },
  { id: 'cuidar_relacao_corpo', rotulo: 'Cuidar da minha relação com o corpo' },
  { id: 'relacao_tranquila_comida', rotulo: 'Ter uma relação mais tranquila com a comida' },
  { id: 'praticar_autocompaixao', rotulo: 'Praticar autocompaixão' },
  { id: 'lidar_comparacao', rotulo: 'Lidar melhor com a comparação' },
  { id: 'criar_ritual_diario', rotulo: 'Criar um ritual diário de cuidado' },
  { id: 'decidir_depois', rotulo: 'Prefiro decidir depois' },
] as const;

export type ObjetivoId = (typeof OBJETIVOS)[number]['id'];
export const OBJETIVO_IDS: ObjetivoId[] = OBJETIVOS.map((o) => o.id) as ObjetivoId[];

// Escolher este item substitui qualquer outra seleção (ver SeletorObjetivos)
// e nunca entra no array gravado — a etapa fica registrada como respondida
// só pelo timestamp onboarding_extra_concluido_em, não pelo conteúdo do array.
export const OBJETIVO_SENTINELA: ObjetivoId = 'decidir_depois';

export function validarObjetivos(valores: string[]): valores is ObjetivoId[] {
  return valores.every((v) => (OBJETIVO_IDS as string[]).includes(v));
}

export function normalizarObjetivosParaGravar(selecionados: ObjetivoId[]): ObjetivoId[] {
  if (selecionados.includes(OBJETIVO_SENTINELA)) return [];
  return selecionados;
}

export const TEMAS_SENSIVEIS = [
  { id: 'corpo_aparencia', rotulo: 'Corpo e aparência' },
  { id: 'alimentacao', rotulo: 'Alimentação' },
  { id: 'comparacao', rotulo: 'Comparação' },
  { id: 'autocritica', rotulo: 'Autocrítica' },
  { id: 'nenhum_desses', rotulo: 'Nenhum desses' },
  { id: 'prefiro_nao_responder', rotulo: 'Prefiro não responder' },
] as const;

export type TemaSensivelId = (typeof TEMAS_SENSIVEIS)[number]['id'];
export const TEMA_SENSIVEL_IDS: TemaSensivelId[] = TEMAS_SENSIVEIS.map((t) => t.id) as TemaSensivelId[];

// "prefiro não responder" nunca entra no array gravado (regra do design).
// "nenhum desses" É gravado — é uma resposta legítima ("nenhum destes temas
// é sensível para mim"), só é exclusiva com as outras opções na UI.
export const TEMA_SENSIVEL_SENTINELA_SKIP: TemaSensivelId = 'prefiro_nao_responder';
export const TEMA_SENSIVEL_EXCLUSIVOS: TemaSensivelId[] = ['nenhum_desses', 'prefiro_nao_responder'];

export function validarTemasSensiveis(valores: string[]): valores is TemaSensivelId[] {
  return valores.every((v) => (TEMA_SENSIVEL_IDS as string[]).includes(v));
}

export function normalizarTemasParaGravar(selecionados: TemaSensivelId[]): TemaSensivelId[] {
  if (selecionados.includes(TEMA_SENSIVEL_SENTINELA_SKIP)) return [];
  return selecionados;
}
