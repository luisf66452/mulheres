export async function inscreverPush(): Promise<'inscrita' | 'nao_suportado' | 'negado'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
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
