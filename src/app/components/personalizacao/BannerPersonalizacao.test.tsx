import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BannerPersonalizacao from './BannerPersonalizacao';

const dispensarPersonalizacao = vi.fn(async () => ({}));
vi.mock('@/app/onboarding/actions', () => ({
  dispensarPersonalizacao: () => dispensarPersonalizacao(),
}));

beforeEach(() => {
  dispensarPersonalizacao.mockClear();
});

describe('BannerPersonalizacao', () => {
  it('mostra o convite e um link para /perfil/personalizacao', () => {
    render(<BannerPersonalizacao aoDispensar={() => {}} />);
    expect(screen.getByText(/personalize sua experiência/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /personalizar agora/i })).toHaveAttribute(
      'href',
      '/perfil/personalizacao'
    );
  });

  it('dispensar chama dispensarPersonalizacao e depois aoDispensar', async () => {
    const aoDispensar = vi.fn();
    render(<BannerPersonalizacao aoDispensar={aoDispensar} />);

    fireEvent.click(screen.getByRole('button', { name: /agora não/i }));

    await waitFor(() => {
      expect(dispensarPersonalizacao).toHaveBeenCalledTimes(1);
      expect(aoDispensar).toHaveBeenCalledTimes(1);
    });
  });
});
