// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsentimentoMarketingBanner from './ConsentimentoMarketingBanner';
import { obterConsentimentoMarketing } from '@/lib/consentimento/consentimentoMarketing';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ConsentimentoMarketingBanner', () => {
  it('aparece quando a usuária nunca respondeu', () => {
    render(<ConsentimentoMarketingBanner />);
    expect(screen.getByRole('region', { name: 'Preferências de cookies' })).toBeInTheDocument();
  });

  it('não aparece quando já existe uma escolha salva', () => {
    window.localStorage.setItem('rose_consentimento_marketing', 'aceito');
    render(<ConsentimentoMarketingBanner />);
    expect(screen.queryByRole('region', { name: 'Preferências de cookies' })).not.toBeInTheDocument();
  });

  it('salva "aceito" e some ao clicar em Aceitar', () => {
    render(<ConsentimentoMarketingBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));

    expect(obterConsentimentoMarketing()).toBe('aceito');
    expect(screen.queryByRole('region', { name: 'Preferências de cookies' })).not.toBeInTheDocument();
  });

  it('salva "recusado" e some ao clicar em Recusar', () => {
    render(<ConsentimentoMarketingBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(obterConsentimentoMarketing()).toBe('recusado');
    expect(screen.queryByRole('region', { name: 'Preferências de cookies' })).not.toBeInTheDocument();
  });
});
