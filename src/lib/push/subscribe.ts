export async function inscreverPush(): Promise<'inscrita' | 'nao_suportado' | 'negado'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'nao_suportado';
  }

  // Fora de producao, /sw.js ativamente cacheia assets estaticos, o que
  // briga com o Fast Refresh do `next dev` (mesma guarda de
  // RegistrarServiceWorker.tsx). Notificacoes push nao sao suportadas em
  // dev por essa razao.
  if (process.env.NODE_ENV !== 'production') {
    return 'nao_suportado';
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') {
    return 'negado';
  }

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  const json = subscription.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    }),
  });

  return 'inscrita';
}
