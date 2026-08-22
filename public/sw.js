const CACHE_NAME = 'rose-static-v1';

// Prefixos de rota que nunca podem ser servidos do cache: autenticacao,
// APIs, e qualquer etapa de pagamento Stripe. Mantidos como passthrough
// total (a rede decide, sem cache), mesmo que a rede falhe.
const ROTAS_NUNCA_CACHEADAS = [
  '/api/',
  '/auth/',
  '/checkout',
  '/sucesso',
  '/cancelado',
  '/login',
  '/onboarding',
];

// Assets estaticos versionados por hash pelo Next.js: seguros para
// stale-while-revalidate porque uma mudanca de conteudo sempre vem com uma
// URL nova (o navegador nunca reusa hash antigo para conteudo novo).
const PREFIXOS_ESTATICOS_CACHEAVEIS = ['/_next/static/', '/icons/'];
const ARQUIVOS_ESTATICOS_CACHEAVEIS = ['/icon', '/apple-icon', '/favicon.ico'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome.startsWith('rose-static-') && nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    ).then(() => self.clients.claim())
  );
});

function ehAssetEstaticoCacheavel(url) {
  return (
    PREFIXOS_ESTATICOS_CACHEAVEIS.some((prefixo) => url.pathname.startsWith(prefixo)) ||
    ARQUIVOS_ESTATICOS_CACHEAVEIS.some((arquivo) => url.pathname.startsWith(arquivo))
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (ROTAS_NUNCA_CACHEADAS.some((rota) => url.pathname.startsWith(rota))) {
    return;
  }

  if (!ehAssetEstaticoCacheavel(url)) {
    // Navegacao/HTML e qualquer outra rota: sempre rede, nunca cache.
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const respostaCacheada = await cache.match(request);
      const buscaNaRede = fetch(request)
        .then((resposta) => {
          if (resposta.ok) {
            cache.put(request, resposta.clone());
          }
          return resposta;
        })
        .catch(() => respostaCacheada);

      return respostaCacheada || buscaNaRede;
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Rose', {
      body: data.body || 'Seu momento de cuidado de hoje está te esperando.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/checkin'));
});
