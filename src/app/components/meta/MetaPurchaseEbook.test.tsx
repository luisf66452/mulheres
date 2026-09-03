// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import MetaPurchaseEbook from './MetaPurchaseEbook';
import { jaDisparado } from '@/lib/meta/eventos';

beforeEach(() => {
  window.localStorage.clear();
  delete (window as unknown as { fbq?: unknown }).fbq;
});

afterEach(() => {
  delete (window as unknown as { fbq?: unknown }).fbq;
});

describe('MetaPurchaseEbook', () => {
  it('dispara Purchase com value/currency vindos do servidor ao montar', async () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    render(<MetaPurchaseEbook sessionId="cs_ebook_123" valor={19.99} moeda="BRL" />);

    await waitFor(() => expect(chamadas).toEqual([['track', 'Purchase', { value: 19.99, currency: 'BRL' }]]));
    expect(jaDisparado('purchase-ebook:cs_ebook_123')).toBe(true);
  });

  it('dispara Purchase mesmo com valor/moeda nulos (usa undefined em vez de quebrar)', async () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    render(<MetaPurchaseEbook sessionId="cs_ebook_456" valor={null} moeda={null} />);

    await waitFor(() =>
      expect(chamadas).toEqual([['track', 'Purchase', { value: undefined, currency: undefined }]])
    );
  });

  it('não dispara de novo se essa sessão já foi marcada como disparada', () => {
    window.localStorage.setItem('rose_fbq_evento:purchase-ebook:cs_ebook_789', '1');
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    render(<MetaPurchaseEbook sessionId="cs_ebook_789" valor={19.99} moeda="BRL" />);

    expect(chamadas).toEqual([]);
  });
});
