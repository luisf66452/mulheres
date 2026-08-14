import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoMenuPerfil from './CartaoMenuPerfil';
import IconePreferencias from './icones/IconePreferencias';

describe('CartaoMenuPerfil', () => {
  it('renderiza o rótulo e aponta para a rota informada', () => {
    render(<CartaoMenuPerfil href="/perfil/preferencias" rotulo="Preferências" Icone={IconePreferencias} />);
    const link = screen.getByRole('link', { name: /Preferências/ });
    expect(link.getAttribute('href')).toBe('/perfil/preferencias');
  });
});
