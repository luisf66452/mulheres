// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BotaoAssinar from './BotaoAssinar';

const CHECKOUT_URL = 'https://checkout.stripe.com/sessao-teste';

function mockFetchOk(dados: { url: string; valor: number | null; moeda: string | null }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => dados,
    }))
  );
}

beforeEach(() => {
  delete (window as unknown as { ttq?: unknown }).ttq;
  delete (window as unknown as { fbq?: unknown }).fbq;
  // window.location.href não pode ser atribuído em jsdom sem isso — evita o
  // "Not implemented: navigation" poluindo a saída do teste.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, href: '' },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as { ttq?: unknown }).ttq;
  delete (window as unknown as { fbq?: unknown }).fbq;
});

describe('BotaoAssinar', () => {
  it('dispara InitiateCheckout no TikTok e no Meta Pixel com o valor/moeda vindos do servidor, antes do redirect', async () => {
    const chamadasTikTok: unknown[][] = [];
    const chamadasMeta: unknown[][] = [];
    window.ttq = { track: (...args: unknown[]) => chamadasTikTok.push(args), page: () => {} };
    window.fbq = (...args: unknown[]) => chamadasMeta.push(args);
    mockFetchOk({ url: CHECKOUT_URL, valor: 19.9, moeda: 'BRL' });

    render(<BotaoAssinar plano="mensal" rotulo="Assinar mensal" />);
    fireEvent.click(screen.getByRole('button', { name: 'Assinar mensal' }));

    await waitFor(() => expect(window.location.href).toBe(CHECKOUT_URL));

    expect(chamadasTikTok).toEqual([['InitiateCheckout', { value: 19.9, currency: 'BRL' }]]);
    expect(chamadasMeta).toEqual([['track', 'InitiateCheckout', { value: 19.9, currency: 'BRL' }]]);
  });

  it('não dispara nenhum evento quando a criação da sessão de checkout falha', async () => {
    const chamadasMeta: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadasMeta.push(args);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({ erro: 'falhou' }) }))
    );

    render(<BotaoAssinar plano="mensal" rotulo="Assinar mensal" />);
    fireEvent.click(screen.getByRole('button', { name: 'Assinar mensal' }));

    await screen.findByRole('alert');

    expect(chamadasMeta).toEqual([]);
    expect(window.location.href).toBe('');
  });
});
