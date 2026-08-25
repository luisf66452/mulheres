import type { PraticaRapida } from '@/lib/praticas-conteudo/tipos';
import type { Pratica } from '@/lib/supabase/types';
import type { ItemCatalogoPratica } from './tipos';

function duracaoLabelDeSegundos(segundos: number | null): string {
  if (!segundos || segundos <= 0) return '';
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return `${minutos} min`;
}

function descricaoCurtaDeConteudo(conteudo: string): string {
  return conteudo.slice(0, 140);
}

export function unificarCatalogo(
  praticasRapidas: PraticaRapida[],
  praticasAudio: Pratica[]
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
    descricaoCurta: descricaoCurtaDeConteudo(pratica.conteudo),
    duracaoLabel: duracaoLabelDeSegundos(pratica.duracao_segundos),
    categoria: pratica.categoria,
    temAudio: true,
  }));

  return [...itensRapidas, ...itensAudio];
}
