// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import FacebookPixel from './FacebookPixel';
import { definirConsentimentoMarketing } from '@/lib/consentimento/consentimentoMarketing';

beforeEach(() => {
  window.localStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '123456');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('FacebookPixel', () => {
  it('não injeta o script nem o <noscript> quando não há consentimento salvo', () => {
    const { container } = render(<FacebookPixel />);
    expect(document.getElementById('facebook-pixel')).not.toBeInTheDocument();
    expect(container.querySelector('noscript')).not.toBeInTheDocument();
  });

  it('não injeta o script quando o consentimento foi recusado', () => {
    definirConsentimentoMarketing('recusado');
    render(<FacebookPixel />);
    expect(document.getElementById('facebook-pixel')).not.toBeInTheDocument();
  });

  it('não injeta nada quando NEXT_PUBLIC_META_PIXEL_ID não está configurado, mesmo com consentimento aceito', () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '');
    definirConsentimentoMarketing('aceito');
    const { container } = render(<FacebookPixel />);

    expect(document.getElementById('facebook-pixel')).not.toBeInTheDocument();
    expect(container.querySelector('noscript')).not.toBeInTheDocument();
  });

  // Precisa rodar por último: o next/script marca o id "facebook-pixel" como
  // já carregado num cache interno do próprio pacote (evita duplicar o
  // script na mesma página de verdade) — esse cache não é resetado entre
  // testes, então uma vez injetado aqui, os outros `it`s acima deixariam de
  // enxergar "ausência" do script se rodassem depois deste.
  it('injeta o script e o <noscript> quando o consentimento foi aceito', () => {
    definirConsentimentoMarketing('aceito');
    const { container } = render(<FacebookPixel />);

    const script = document.getElementById('facebook-pixel');
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toContain("fbq('init', '123456')");

    const noscript = container.querySelector('noscript');
    expect(noscript).toBeInTheDocument();
    expect(noscript?.innerHTML).toContain(
      'src="https://www.facebook.com/tr?id=123456&ev=PageView&noscript=1"'
    );
  });
});
