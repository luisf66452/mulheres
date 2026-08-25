import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvisoSeguranca from './AvisoSeguranca';

describe('AvisoSeguranca', () => {
  it('mostra um link para /seguranca', () => {
    render(<AvisoSeguranca />);
    expect(screen.getByRole('link', { name: 'Ver recursos de apoio' }).getAttribute('href')).toBe(
      '/seguranca'
    );
  });

  it('é a variante compacta — não mostra o texto de alerta "destacado" do CardAtencaoSeguranca', () => {
    render(<AvisoSeguranca />);
    expect(screen.queryByText(/Percebemos palavras que podem indicar/i)).toBeNull();
  });
});
