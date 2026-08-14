import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CabecalhoPerfil from './CabecalhoPerfil';

describe('CabecalhoPerfil', () => {
  it('mostra o nome real da usuária quando disponível', () => {
    render(<CabecalhoPerfil nome="Sofia" frase="Minha frase" />);
    expect(screen.getByText('Sofia')).toBeTruthy();
  });

  it('mostra o fallback "Olá" quando não há nome', () => {
    render(<CabecalhoPerfil nome={null} frase={null} />);
    expect(screen.getByText('Olá')).toBeTruthy();
  });

  it('mostra a frase pessoal real quando disponível', () => {
    render(<CabecalhoPerfil nome="Sofia" frase="Cuidar de mim é a minha escolha." />);
    expect(screen.getByText('Cuidar de mim é a minha escolha.')).toBeTruthy();
  });

  it('mostra uma frase padrão quando a usuária não personalizou a sua', () => {
    render(<CabecalhoPerfil nome="Sofia" frase={null} />);
    expect(screen.getByText(/./, { selector: 'span.text-texto-suave' })).toBeTruthy();
  });

  it('o avatar e o nome levam para a edição de perfil', () => {
    render(<CabecalhoPerfil nome="Sofia" frase={null} />);
    const link = screen.getByRole('link', { name: 'Editar perfil' });
    expect(link.getAttribute('href')).toBe('/perfil/editar');
  });

  it('mostra as iniciais da usuária no avatar', () => {
    render(<CabecalhoPerfil nome="Maria Clara" frase={null} />);
    expect(screen.getByText('MC')).toBeTruthy();
  });
});
