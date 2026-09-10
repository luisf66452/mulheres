// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { obterDadosClienteParaMetadata } from './dadosCliente';

function criarRequisicao(headers: Record<string, string>) {
  return new Request('http://localhost/api/stripe/checkout', { headers });
}

describe('obterDadosClienteParaMetadata', () => {
  it('extrai o primeiro IP de x-forwarded-for e o user-agent', () => {
    const request = criarRequisicao({
      'x-forwarded-for': '203.0.113.42, 70.41.3.18',
      'user-agent': 'Mozilla/5.0 teste',
    });

    expect(obterDadosClienteParaMetadata(request)).toEqual({
      ip: '203.0.113.42',
      userAgent: 'Mozilla/5.0 teste',
    });
  });

  it('retorna undefined pros dois quando os headers não existem', () => {
    const request = criarRequisicao({});

    expect(obterDadosClienteParaMetadata(request)).toEqual({ ip: undefined, userAgent: undefined });
  });

  it('trunca o user-agent em 500 caracteres pra caber no limite de metadata do Stripe', () => {
    const request = criarRequisicao({ 'user-agent': 'a'.repeat(600) });

    expect(obterDadosClienteParaMetadata(request).userAgent).toHaveLength(500);
  });
});
