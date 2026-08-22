import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const codigoSw = readFileSync(resolve(__dirname, '../../../public/sw.js'), 'utf-8');

/**
 * Extrai o texto do array `const NOME = [ ... ];` para permitir asserções
 * de que uma rota/arquivo esta declarado especificamente dentro do array,
 * e nao apenas em qualquer lugar do arquivo (ex.: um comentario).
 */
function extrairArrayLiteral(codigo: string, nomeConst: string): string {
  const inicioMarcador = `const ${nomeConst} = [`;
  const inicio = codigo.indexOf(inicioMarcador);
  if (inicio === -1) {
    throw new Error(`Nao encontrei a declaracao de ${nomeConst} no sw.js`);
  }
  const fimConteudo = codigo.indexOf('];', inicio);
  if (fimConteudo === -1) {
    throw new Error(`Nao encontrei o fechamento "];" do array ${nomeConst} no sw.js`);
  }
  return codigo.slice(inicio + inicioMarcador.length, fimConteudo);
}

describe('contrato de seguranca do service worker', () => {
  it('declara um CACHE_NAME versionado', () => {
    expect(codigoSw).toMatch(/CACHE_NAME\s*=\s*['"]rose-static-v\d+['"]/);
  });

  it('ignora metodos diferentes de GET no fetch', () => {
    expect(codigoSw).toMatch(/request\.method\s*!==\s*['"]GET['"]/);
  });

  it('nunca intercepta rotas sensiveis', () => {
    const arrayRotas = extrairArrayLiteral(codigoSw, 'ROTAS_NUNCA_CACHEADAS');
    for (const rota of ['/api/', '/auth/', '/checkout', '/sucesso', '/cancelado', '/login', '/onboarding']) {
      // A rota precisa estar declarada dentro do array ROTAS_NUNCA_CACHEADAS,
      // nao apenas em qualquer lugar do arquivo (ex.: um comentario ou string
      // nao relacionada).
      expect(arrayRotas).toContain(`'${rota}'`);
    }
  });

  it('checa a lista de exclusao ANTES de decidir responder a requisicao (guard real, nao so presente no arquivo)', () => {
    const indiceGuard = codigoSw.indexOf('ROTAS_NUNCA_CACHEADAS.some');
    const indiceRespondWith = codigoSw.indexOf('event.respondWith(');

    expect(indiceGuard).toBeGreaterThan(-1);
    expect(indiceRespondWith).toBeGreaterThan(-1);
    // O guard de rotas sensiveis precisa aparecer textualmente antes do
    // primeiro event.respondWith(: garante que a decisao de nunca cachear
    // acontece antes (e pode causar um `return` que impede) o
    // respondWith, e nao depois dele.
    expect(indiceGuard).toBeLessThan(indiceRespondWith);
  });

  it('usa fronteira de segmento (nao prefixo bruto) para casar rotas sensiveis e arquivos estaticos', () => {
    // Uma rota futura como "/loginhelp" ou "/onboardingx" nao pode ser
    // bloqueada por um startsWith bruto sobre "/login" ou "/onboarding"
    // — a checagem precisa passar por uma funcao de fronteira de
    // segmento (igualdade exata ou seguido de "/").
    expect(codigoSw).toMatch(/function\s+casaComFronteiraDeSegmento/);
    expect(codigoSw).toContain('casaComFronteiraDeSegmento(url.pathname, rota)');

    // Arquivos estaticos unicos (icon.png, apple-icon.png, favicon.ico) sao
    // rotas exatas geradas pelo Next.js, nao diretorios: precisam de
    // igualdade exata, nao prefixo.
    const arrayArquivos = extrairArrayLiteral(codigoSw, 'ARQUIVOS_ESTATICOS_CACHEAVEIS');
    for (const arquivo of ['/icon.png', '/apple-icon.png', '/favicon.ico']) {
      expect(arrayArquivos).toContain(`'${arquivo}'`);
    }
    expect(codigoSw).toContain('ARQUIVOS_ESTATICOS_CACHEAVEIS.some((arquivo) => url.pathname === arquivo)');
  });

  it('limpa caches antigos no activate usando o CACHE_NAME real (nao uma constante nao utilizada)', () => {
    const inicioActivate = codigoSw.indexOf("addEventListener('activate'");
    expect(inicioActivate).toBeGreaterThan(-1);

    const fimActivate = codigoSw.indexOf('});', inicioActivate);
    const blocoActivate = codigoSw.slice(inicioActivate, fimActivate);

    expect(blocoActivate).toMatch(/caches\.delete/);
    // O filtro de limpeza precisa referenciar CACHE_NAME de fato (para
    // preservar o cache atual e apagar apenas versoes antigas), nao so
    // declarar a constante em outro lugar do arquivo.
    expect(blocoActivate).toContain('nome !== CACHE_NAME');
  });

  it('usa CACHE_NAME (nao uma constante nao utilizada) ao abrir o cache no fetch handler', () => {
    expect(codigoSw).toContain('caches.open(CACHE_NAME)');
  });

  it('mantem os handlers de push e notificationclick', () => {
    expect(codigoSw).toMatch(/addEventListener\(['"]push['"]/);
    expect(codigoSw).toMatch(/addEventListener\(['"]notificationclick['"]/);
    expect(codigoSw).toContain("clients.openWindow('/checkin')");
  });
});
