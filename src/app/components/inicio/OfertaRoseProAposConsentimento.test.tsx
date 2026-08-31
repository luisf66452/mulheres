// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsentimentoMarketingBanner from '@/app/components/ConsentimentoMarketingBanner';
import OfertaRoseProAposConsentimento from './OfertaRoseProAposConsentimento';

vi.mock('./OfertaRosePro', () => ({
  default: () => (
    <div role="dialog" aria-label="Oferta Rose Pro">
      Oferta Rose Pro
    </div>
  ),
}));

beforeEach(() => {
  window.localStorage.clear();
});

describe('OfertaRoseProAposConsentimento', () => {
  it('mantém a oferta fechada enquanto a escolha de cookies está pendente', () => {
    render(
      <>
        <OfertaRoseProAposConsentimento />
        <ConsentimentoMarketingBanner />
      </>
    );

    expect(screen.getByRole('region', { name: 'Preferências de cookies' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Oferta Rose Pro' })).not.toBeInTheDocument();
  });

  it.each(['Aceitar', 'Recusar'])('abre a oferta somente depois de clicar em %s', (escolha) => {
    render(
      <>
        <OfertaRoseProAposConsentimento />
        <ConsentimentoMarketingBanner />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: escolha }));

    expect(screen.queryByRole('region', { name: 'Preferências de cookies' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Oferta Rose Pro' })).toBeInTheDocument();
  });

  it('abre normalmente quando a escolha já estava salva neste navegador', () => {
    window.localStorage.setItem('rose_consentimento_marketing', 'recusado');

    render(<OfertaRoseProAposConsentimento />);

    expect(screen.getByRole('dialog', { name: 'Oferta Rose Pro' })).toBeInTheDocument();
  });
});
