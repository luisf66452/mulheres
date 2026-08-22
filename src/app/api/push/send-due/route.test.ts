// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// createClient nunca deveria ser chamado quando a autenticação do cron falha
// — se este mock for invocado num teste de rejeição, o teste também falha,
// o que garante que a checagem de CRON_SECRET acontece ANTES de qualquer
// acesso ao banco.
const createClientMock = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/push/enviar', () => ({
  garantirVapidConfigurado: vi.fn(),
  enviarParaSubscricoes: vi.fn(),
}));

function requisicao(headers: Record<string, string> = {}) {
  return new NextRequest('https://rose.exemplo.com/api/push/send-due', { headers });
}

describe('GET /api/push/send-due — autenticação do cron', () => {
  const ENV_ORIGINAL = process.env;

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    process.env = { ...ENV_ORIGINAL, CRON_SECRET: 'segredo-correto' };
  });

  afterEach(() => {
    process.env = ENV_ORIGINAL;
  });

  it('rejeita sem header Authorization', async () => {
    const { GET } = await import('./route');
    const resposta = await GET(requisicao());

    expect(resposta.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('rejeita com um Bearer token incorreto', async () => {
    const { GET } = await import('./route');
    const resposta = await GET(requisicao({ authorization: 'Bearer token-errado' }));

    expect(resposta.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('rejeita quando CRON_SECRET nao esta configurado no ambiente (nunca aceita "Bearer undefined")', async () => {
    process.env.CRON_SECRET = '';
    const { GET } = await import('./route');
    const resposta = await GET(requisicao({ authorization: 'Bearer undefined' }));

    expect(resposta.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('rejeita um header de tamanho diferente do esperado sem lancar (timingSafeEqual exige buffers do mesmo tamanho)', async () => {
    const { GET } = await import('./route');
    const resposta = await GET(requisicao({ authorization: 'Bearer curto' }));

    expect(resposta.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
