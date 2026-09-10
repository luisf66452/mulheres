// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enviarEventoConversionsApi } from './conversionsApi';

const DADOS_CLIENTE = { clientIpAddress: '203.0.113.42', clientUserAgent: 'Mozilla/5.0 teste' };

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

    await enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1', ...DADOS_CLIENTE });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // A Meta recusa (HTTP 400) qualquer evento sem nenhum dado de
  // identificação do cliente — confirmado testando contra a API real (ver
  // src/lib/meta/conversionsApi.ts). client_ip_address/client_user_agent são
  // capturados na criação do checkout (ver src/lib/meta/dadosCliente.ts) e
  // devem sempre acompanhar o evento.
  it('não faz nenhuma requisição quando não há client_ip_address nem client_user_agent (a Meta recusaria)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('envia o evento pra Graph API com os dados mínimos, o eventId para dedup com o pixel do navegador e os dados do cliente', async () => {
    const fetchMock = vi.fn(async (_url: string, _opcoes?: RequestInit) => ({ ok: true, text: async () => '' }));
    vi.stubGlobal('fetch', fetchMock);

    await enviarEventoConversionsApi({
      nomeEvento: 'Purchase',
      eventId: 'cs_1',
      value: 19.9,
      currency: 'BRL',
      urlOrigem: 'https://exemplo.com/ebook/obrigado',
      ...DADOS_CLIENTE,
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
      user_data: { client_ip_address: '203.0.113.42', client_user_agent: 'Mozilla/5.0 teste' },
      custom_data: { value: 19.9, currency: 'BRL' },
    });
  });

  it('envia o evento mesmo com só um dos dois dados de cliente disponível', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => '' }));
    vi.stubGlobal('fetch', fetchMock);

    await enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1', clientUserAgent: 'Mozilla/5.0 teste' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('não lança erro quando a Meta recusa o evento (loga e segue)', async () => {
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => 'erro da meta' })));

    await expect(
      enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1', ...DADOS_CLIENTE })
    ).resolves.toBeUndefined();

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

    await expect(
      enviarEventoConversionsApi({ nomeEvento: 'Purchase', eventId: 'cs_1', ...DADOS_CLIENTE })
    ).resolves.toBeUndefined();

    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });
});
