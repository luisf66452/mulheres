import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const codigoSw = readFileSync(resolve(__dirname, '../../../public/sw.js'), 'utf-8');

describe('contrato de seguranca do service worker', () => {
  it('declara um CACHE_NAME versionado', () => {
    expect(codigoSw).toMatch(/CACHE_NAME\s*=\s*['"]rose-static-v\d+['"]/);
  });

  it('ignora metodos diferentes de GET no fetch', () => {
    expect(codigoSw).toMatch(/request\.method\s*!==\s*['"]GET['"]/);
  });

  it('nunca intercepta rotas sensiveis', () => {
    for (const rota of ['/api/', '/auth/', '/checkout', '/login', '/onboarding']) {
      expect(codigoSw).toContain(rota);
    }
  });

  it('limpa caches antigos no activate', () => {
    expect(codigoSw).toMatch(/caches\.delete/);
    expect(codigoSw).toMatch(/addEventListener\(['"]activate['"]/);
  });

  it('mantem os handlers de push e notificationclick', () => {
    expect(codigoSw).toMatch(/addEventListener\(['"]push['"]/);
    expect(codigoSw).toMatch(/addEventListener\(['"]notificationclick['"]/);
    expect(codigoSw).toContain("clients.openWindow('/checkin')");
  });
});
