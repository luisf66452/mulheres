import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoItemCatalogo from './CartaoItemCatalogo';
import type { ItemCatalogoPratica } from '@/lib/praticas-catalogo/tipos';

const ITEM_RAPIDA: ItemCatalogoPratica = {
  id: 'rapida:respiracao',
  fonte: 'rapida',
  idOriginal: 'respiracao',
  href: '/praticas/respiracao',
  titulo: 'Respiração',
  descricaoCurta: 'Respire fundo e reconecte-se.',
  duracaoLabel: '3 min',
  categoria: 'respiracao',
  temAudio: false,
};

const ITEM_AUDIO: ItemCatalogoPratica = {
  id: 'audio:uuid-1',
  fonte: 'audio',
  idOriginal: 'uuid-1',
  href: '/praticas/uuid-1',
  titulo: 'Pausa de autocompaixão',
  descricaoCurta: 'Um convite gentil para se acolher.',
  duracaoLabel: '5 min',
  categoria: 'autocompaixao',
  temAudio: true,
};

describe('CartaoItemCatalogo', () => {
  it('renderiza um link com href igual ao do item', () => {
    render(<CartaoItemCatalogo item={ITEM_RAPIDA} />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/praticas/respiracao');
  });

  it('renderiza o título e a duração do item', () => {
    render(<CartaoItemCatalogo item={ITEM_AUDIO} />);
    expect(screen.getByText('Pausa de autocompaixão')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('indica visualmente quando o item tem áudio guiado', () => {
    render(<CartaoItemCatalogo item={ITEM_AUDIO} />);
    expect(screen.getByText('Áudio guiado')).toBeInTheDocument();
  });

  it('não mostra o indicador de áudio para práticas rápidas sem áudio', () => {
    render(<CartaoItemCatalogo item={ITEM_RAPIDA} />);
    expect(screen.queryByText('Áudio guiado')).not.toBeInTheDocument();
  });
});
