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
  '/perfil/assinatura',
  '/login',
  '/onboarding',
];

// Assets estaticos versionados por hash pelo Next.js: seguros para
// stale-while-revalidate porque uma mudanca de conteudo sempre vem com uma
// URL nova (o navegador nunca reusa hash antigo para conteudo novo).
const PREFIXOS_ESTATICOS_CACHEAVEIS = ['/_next/static/', '/icons/'];
// Arquivos unicos gerados pelo Next.js (nao diretorios): exigem match exato
// para nao colidir por prefixo com rotas futuras (ex.: /icon-guide).
const ARQUIVOS_ESTATICOS_CACHEAVEIS = ['/icon.png', '/apple-icon.png', '/favicon.ico'];

// Verifica se `pathname` casa com `rota` respeitando fronteira de segmento.
// Rotas ja terminadas em "/" (ex.: "/api/") sao prefixos de diretorio
// legitimos. Rotas sem barra final (ex.: "/login") so casam por igualdade
// exata ou seguidas de "/", evitando colisao com uma rota futura nao
// relacionada (ex.: "/loginhelp" nao deve casar com "/login").
function casaComFronteiraDeSegmento(pathname, rota) {
  if (rota.endsWith('/')) {
    return pathname.startsWith(rota);
  }
  return pathname === rota || pathname.startsWith(`${rota}/`);
}

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
    ARQUIVOS_ESTATICOS_CACHEAVEIS.some((arquivo) => url.pathname === arquivo)
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

  if (ROTAS_NUNCA_CACHEADAS.some((rota) => casaComFronteiraDeSegmento(url.pathname, rota))) {
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
        // Sem cache E rede falhando: nao ha resposta valida a devolver.
        // Response.error() produz uma network error propriamente dita, em
        // vez de resolver `undefined` (o que faria event.respondWith
        // lancar).
        .catch(() => respostaCacheada || Response.error());

      if (respostaCacheada) {
        // Responde do cache imediatamente, mas mantem a revalidacao em
        // segundo plano viva com waitUntil — sem isso o navegador pode
        // encerrar o service worker assim que a resposta e devolvida,
        // antes do fetch de revalidacao terminar.
        event.waitUntil(buscaNaRede);
        return respostaCacheada;
      }

      return buscaNaRede;
    })
  );
});

// Só aceita um deep link relativo e do mesmo domínio: precisa começar com uma
// única barra ("/…") e nunca com "//" (que o navegador trata como protocolo-
// relativo, ou seja, um domínio externo). Isso é o que impede o payload do
// push — que passa pela rede e pode em tese ser adulterado antes de chegar
// aqui — de redirecionar a usuária pra fora do app.
function deepLinkSeguro(url, fallback) {
  if (typeof url !== 'string') return fallback;
  if (!url.startsWith('/') || url.startsWith('//')) return fallback;
  return url;
}

self.addEventListener('push', (event) => {
  // event.data.json() lança se o payload não for JSON válido — nunca confia
  // cegamente no conteúdo de uma mensagem de push (ela passa pela rede e por
  // um provedor externo antes de chegar aqui).
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = {};
  }

  const titulo = typeof dados.title === 'string' && dados.title.trim() ? dados.title : 'Rose';
  const corpo =
    typeof dados.body === 'string' && dados.body.trim()
      ? dados.body
      : 'Seu momento de cuidado de hoje está te esperando.';
  const url = deepLinkSeguro(dados.url, '/inicio');
  // `tag` faz o navegador substituir uma notificação pendente com a mesma
  // chave em vez de empilhar — essencial pra não gerar burst quando o
  // aparelho reconecta e recebe várias mensagens de push atrasadas de uma
  // vez, e pra dedup visual (ex.: dois lembretes da mesma sessão).
  const tag = typeof dados.tag === 'string' && dados.tag ? dados.tag : 'rose-generico';

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      renotify: false,
      data: { url },
      actions: [
        { action: 'continuar', title: 'Continuar' },
        { action: 'agora_nao', title: 'Agora não' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // "Agora não" só fecha a notificação, sem abrir nada — nunca insiste.
  if (event.action === 'agora_nao') {
    return;
  }

  const url = deepLinkSeguro(event.notification.data && event.notification.data.url, '/inicio');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((listaDeClientes) => {
      // Reaproveita uma janela da Rose já aberta em vez de abrir uma nova aba
      // por cima — navega ela pro deep link e foca. Só abre janela nova se
      // não houver nenhuma.
      for (const cliente of listaDeClientes) {
        if ('focus' in cliente) {
          if ('navigate' in cliente) {
            return cliente.navigate(url).then((clienteNavegado) => clienteNavegado && clienteNavegado.focus());
          }
          return cliente.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
