// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EbookObrigadoPage from './page';
import { obterStripe } from '@/lib/stripe/client';
import { obterDownloadEbook } from '@/lib/stripe/ebook';

vi.mock('@/lib/stripe/client', () => ({
  obterStripe: vi.fn(),
}));

vi.mock('@/lib/stripe/ebook', () => ({
  obterDownloadEbook: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(obterStripe).mockReset();
  vi.mocked(obterDownloadEbook).mockReset();
});

describe('/ebook/obrigado', () => {
  it('mostra o link de download quando o pagamento está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({
      confirmado: true,
      urlDownload: 'https://storage.exemplo.com/assinada',
      valor: 19.99,
      moeda: 'BRL',
    });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pago' }) });
    render(jsx);

    const link = screen.getByRole('link', { name: /baixar meu ebook/i });
    expect(link).toHaveAttribute('href', 'https://storage.exemplo.com/assinada');
  });

  it('mostra mensagem genérica quando não há session_id', async () => {
    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
    expect(obterDownloadEbook).not.toHaveBeenCalled();
  });

  it('mostra mensagem genérica quando o pagamento não está confirmado', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({ confirmado: false, urlDownload: null, valor: null, moeda: null });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_nao_pago' }) });
    render(jsx);

    expect(screen.getByText(/não encontramos sua compra/i)).toBeInTheDocument();
  });

  it('mostra mensagem de contato quando confirmado mas a signed url falhou', async () => {
    vi.mocked(obterStripe).mockReturnValue({} as never);
    vi.mocked(obterDownloadEbook).mockResolvedValue({ confirmado: true, urlDownload: null, valor: 19.99, moeda: 'BRL' });

    const jsx = await EbookObrigadoPage({ searchParams: Promise.resolve({ session_id: 'cs_pago' }) });
    render(jsx);

    expect(screen.getByText(/entre em contato/i)).toBeInTheDocument();
  });
});
