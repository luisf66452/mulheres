import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import type { PraticaCatalogo } from '@/lib/supabase/types';
import type { ItemCatalogoPratica } from './tipos';

function duracaoLabelDeSegundos(segundos: number | null): string {
  if (!segundos || segundos <= 0) return '';
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return `${minutos} min`;
}

// public.praticas_catalogo (fonte de praticasAudio) nunca traz `conteudo` —
// é conteúdo protegido, só liberado pela RLS da tabela base pra quem tem
// acesso (ver /praticas/[id]). Na listagem, todo item de áudio é só um
// teaser: título + duração + este texto genérico, nunca um resumo do
// conteúdo de verdade.
const DESCRICAO_TEASER_AUDIO = 'Prática guiada em áudio.';

export function unificarCatalogo(
  praticasRapidas: PraticaRapida[],
  praticasAudio: PraticaCatalogo[]
): ItemCatalogoPratica[] {
  const itensRapidas: ItemCatalogoPratica[] = praticasRapidas.map((pratica) => ({
    id: `rapida:${pratica.id}`,
    fonte: 'rapida',
    idOriginal: pratica.id,
    href: `/praticas/${pratica.id}`,
    titulo: pratica.titulo,
    descricaoCurta: pratica.descricaoCurta,
    duracaoLabel: pratica.duracaoLabel,
    categoria: pratica.categoria,
    temAudio: false,
  }));

  const itensAudio: ItemCatalogoPratica[] = praticasAudio.map((pratica) => ({
    id: `audio:${pratica.id}`,
    fonte: 'audio',
    idOriginal: pratica.id,
    href: `/praticas/${pratica.id}`,
    titulo: pratica.titulo,
    descricaoCurta: DESCRICAO_TEASER_AUDIO,
    duracaoLabel: duracaoLabelDeSegundos(pratica.duracao_segundos),
    categoria: pratica.categoria,
    temAudio: true,
  }));

  return [...itensRapidas, ...itensAudio];
}
