// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoPratica from './CartaoPratica';
import type { Pratica } from '@/lib/supabase/types';

const PRATICA: Pratica = {
  id: 'pratica-1',
  categoria: 'aterramento',
  tipo: 'respiracao',
  titulo: 'Respiração 4-7-8',
  conteudo: 'Inspire por 4 segundos...',
  status: 'publicada',
  criado_em: '2026-08-20T10:00:00.000Z',
  audio_url: null,
  duracao_segundos: null,
  transcricao: null,
  audio_status: 'rascunho',
  is_pro: false,
};

describe('CartaoPratica', () => {
  it('renderiza título, conteúdo e um link para a prática', () => {
    render(<CartaoPratica pratica={PRATICA} favoritado={false} />);
    expect(screen.getByText('Respiração 4-7-8', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/praticas/pratica-1');
  });

  it('renderiza o BotaoFavorito refletindo o estado inicial recebido', () => {
    render(<CartaoPratica pratica={PRATICA} favoritado={true} />);
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true');
  });
});
