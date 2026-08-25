import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ExportarDadosBotao from './ExportarDadosBotao';

function respostaFake(opts: { ok: boolean; filename?: string; blob?: Blob }) {
  return {
    ok: opts.ok,
    headers: new Headers(opts.filename ? { 'content-disposition': `attachment; filename="${opts.filename}"` } : {}),
    blob: vi.fn(async () => opts.blob ?? new Blob(['conteudo'])),
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake-url'), revokeObjectURL: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ExportarDadosBotao', () => {
  it('renderiza os dois formatos de exportação', () => {
    render(<ExportarDadosBotao />);
    expect(screen.getByRole('button', { name: /baixar em json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /baixar em csv/i })).toBeInTheDocument();
  });

  it('busca /api/exportar/json e dispara o download com o nome de arquivo do header', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.json' }) as never
    );
    const cliqueSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/exportar/json', expect.objectContaining({ cache: 'no-store' })));
    expect(cliqueSpy).toHaveBeenCalled();
    cliqueSpy.mockRestore();
  });

  it('busca /api/exportar/csv quando o botão de CSV é clicado', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.zip' }) as never
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em csv/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/exportar/csv', expect.objectContaining({ cache: 'no-store' })));
  });

  it('mostra erro amigável quando a resposta não é ok', async () => {
    vi.mocked(fetch).mockResolvedValue(respostaFake({ ok: false }) as never);

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível exportar/i);
  });

  it('mostra erro amigável e não tenta baixar quando a sessão expirou e a resposta é um redirect (opaqueredirect)', async () => {
    const blobSpy = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      type: 'opaqueredirect',
      headers: new Headers(),
      blob: blobSpy,
    } as never);
    const cliqueSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    cliqueSpy.mockClear();

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível exportar/i);
    expect(fetch).toHaveBeenCalledWith('/api/exportar/json', expect.objectContaining({ redirect: 'manual' }));
    expect(blobSpy).not.toHaveBeenCalled();
    expect(cliqueSpy).not.toHaveBeenCalled();
    cliqueSpy.mockRestore();
  });

  it('desabilita os botões enquanto uma exportação está em andamento', async () => {
    let resolverFetch: (valor: unknown) => void = () => {};
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => (resolverFetch = resolve)) as never);

    render(<ExportarDadosBotao />);
    fireEvent.click(screen.getByRole('button', { name: /baixar em json/i }));

    expect(screen.getByRole('button', { name: /preparando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /baixar em csv/i })).toBeDisabled();

    resolverFetch(respostaFake({ ok: true, filename: 'rose-meus-dados-2026-08-24.json' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /baixar em json/i })).toBeEnabled());
  });
});
