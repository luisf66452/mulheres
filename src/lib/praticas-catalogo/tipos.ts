// Forma unificada de item de listagem em /praticas, combinando as práticas
// rápidas interativas (código, sem persistência) com as práticas em áudio
// publicadas (tabela `praticas`). Não substitui nenhum dos dois catálogos
// de origem — é só a camada de apresentação da listagem.
export type FonteCatalogoPratica = 'rapida' | 'audio';

export interface ItemCatalogoPratica {
  // Prefixado pela fonte para garantir unicidade entre os dois catálogos
  // (ex.: "rapida:respiracao" vs "audio:<uuid-do-banco>") — nunca colide
  // mesmo que um slug de PRATICAS_RAPIDAS coincida com um id de praticas.
  id: string;
  fonte: FonteCatalogoPratica;
  idOriginal: string;
  href: string;
  titulo: string;
  descricaoCurta: string;
  duracaoLabel: string;
  categoria: string;
  temAudio: boolean;
}
