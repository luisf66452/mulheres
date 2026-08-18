self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const url = data.url || '/checkin';
  event.waitUntil(
    self.registration.showNotification(data.title || 'Rose', {
      body: data.body || 'Seu momento de cuidado de hoje está te esperando.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/checkin';

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Sem janela já aberta na rota certa: reaproveita qualquer janela do
      // app já aberta (navega e foca) em vez de sempre abrir uma nova aba.
      const clienteExistente = clientList.find((client) => 'focus' in client && 'navigate' in client);
      if (clienteExistente) {
        await clienteExistente.navigate(url);
        return clienteExistente.focus();
      }

      return clients.openWindow(url);
    })()
  );
});
