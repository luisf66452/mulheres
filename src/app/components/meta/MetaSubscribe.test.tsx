// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import MetaSubscribe from './MetaSubscribe';
import { jaDisparado } from '@/lib/meta/eventos';

beforeEach(() => {
  window.localStorage.clear();
  delete (window as unknown as { fbq?: unknown }).fbq;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as { fbq?: unknown }).fbq;
});

describe('MetaSubscribe', () => {
  it('dispara Subscribe com value/currency vindos do servidor quando a sessão está confirmada como paga', async () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('/api/stripe/confirmar-pagamento?session_id=sess_123');
        return { ok: true, json: async () => ({ confirmado: true, valor: 19.9, moeda: 'BRL' }) };
      })
    );

    render(<MetaSubscribe sessionId="sess_123" />);

    await waitFor(() => expect(chamadas).toEqual([['track', 'Subscribe', { value: 19.9, currency: 'BRL' }]]));
    expect(jaDisparado('subscribe:sess_123')).toBe(true);
  });

  it('não dispara Subscribe quando o servidor não confirma o pagamento como pago', async () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ confirmado: false, valor: null, moeda: null }) }))
    );

    render(<MetaSubscribe sessionId="sess_456" />);

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
    expect(chamadas).toEqual([]);
    expect(jaDisparado('subscribe:sess_456')).toBe(false);
  });

  it('não confirma de novo (nem dispara evento) se essa sessão já foi marcada como disparada', async () => {
    window.localStorage.setItem('rose_fbq_evento:subscribe:sess_789', '1');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<MetaSubscribe sessionId="sess_789" />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
