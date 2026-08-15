// src/app/progresso/CartaoConquistas.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaoConquistas from './CartaoConquistas';

describe('CartaoConquistas', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('mostra as 3 conquistas bloqueadas com o progresso real quando não há nenhum dado', () => {
    render(
      <CartaoConquistas
        usuariaId="u1"
        melhorSequencia={0}
        totalCheckins={0}
        totalPraticasCuradas={0}
        totalPraticasRapidas={0}
      />
    );
    expect(screen.getByText('7 dias de sequência')).toBeTruthy();
    expect(screen.getByText('0 de 7')).toBeTruthy();
    expect(screen.getByText('0 de 5')).toBeTruthy();
    expect(screen.getByText('0 de 3')).toBeTruthy();
  });

  it('mostra a descrição no lugar do progresso quando a conquista está desbloqueada', () => {
    render(
      <CartaoConquistas
        usuariaId="u1"
        melhorSequencia={7}
        totalCheckins={5}
        totalPraticasCuradas={3}
        totalPraticasRapidas={0}
      />
    );
    expect(screen.getByText('Você manteve consistência no seu cuidado.')).toBeTruthy();
    expect(screen.getByText('Você se conectou com suas emoções.')).toBeTruthy();
    expect(screen.getByText('Pequenos passos, grandes transformações.')).toBeTruthy();
  });

  it('soma práticas rápidas (contadas no servidor) às práticas curadas', async () => {
    render(
      <CartaoConquistas
        usuariaId="u1"
        melhorSequencia={0}
        totalCheckins={0}
        totalPraticasCuradas={1}
        totalPraticasRapidas={2}
      />
    );
    expect(await screen.findByText('Pequenos passos, grandes transformações.')).toBeTruthy();
  });

  it('não repete a celebração de uma conquista já vista em uma renderização anterior', async () => {
    window.localStorage.setItem('conquistas:vistas:u1', JSON.stringify(['checkins-5']));
    const { container } = render(
      <CartaoConquistas
        usuariaId="u1"
        melhorSequencia={0}
        totalCheckins={5}
        totalPraticasCuradas={0}
        totalPraticasRapidas={0}
      />
    );
    await screen.findByText('Você se conectou com suas emoções.');
    expect(container.querySelector('[class*="animate-"]')).toBeNull();
  });
});
