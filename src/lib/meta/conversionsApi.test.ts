// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enviarEventoConversionsApi } from './conversionsApi';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', 'pixel_123');
  vi.stubEnv('META_CONVERSIONS_API_TOKEN', 'token_secreto');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('enviarEventoConversionsApi', () => {
  it('não faz nenhuma requisição quando o token ou o pixel ID não estão configurados', async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1' });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia o evento pra Graph API com os dados mínimos e o eventId para dedup com o pixel do navegador', async () => {
    const fetchMock = vi.fn(async (_url: string, _opcoes?: RequestInit) => ({ ok: true, text: async () => '' }));
    vi.stubGlobal('fetch', fetchMock);

    await enviarEventoConversionsApi({
      nomeEvento: 'Purchase',
      eventId: 'cs_1',
      value: 19.9,
      currency: 'BRL',
      urlOrigem: 'https://exemplo.com/ebook/obrigado',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/pixel_123/events');
    const corpo = JSON.parse((opcoes?.body ?? '{}') as string);
    expect(corpo.access_token).toBe('token_secreto');
    expect(corpo.data[0]).toMatchObject({
      event_name: 'Purchase',
      event_id: 'cs_1',
      action_source: 'website',
      event_source_url: 'https://exemplo.com/ebook/obrigado',
      custom_data: { value: 19.9, currency: 'BRL' },
    });
  });

  it('não lança erro quando a Meta recusa o evento (loga e segue)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => 'erro da meta' })));

    await expect(enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1' })).resolves.toBeUndefined();

    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('não lança erro quando a requisição falha (ex.: rede fora do ar)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('falha de rede');
      })
    );

    await expect(enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1' })).resolves.toBeUndefined();

    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
