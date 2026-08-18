import { chaveVapidParaUint8Array } from './vapid';

export type ResultadoInscricaoPush = 'inscrita' | 'nao_suportado' | 'negado' | 'erro';

function suportaPush(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

async function registrarInscricaoNoServidor(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return false;
  }

  const fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    const resposta = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        fusoHorario,
      }),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

export async function inscreverPush(): Promise<ResultadoInscricaoPush> {
  if (!suportaPush()) {
    return 'nao_suportado';
  }

  try {
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') {
      return 'negado';
    }

    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;

    // Reaproveita a inscrição existente deste navegador/dispositivo em vez de
    // criar outra: pushManager.subscribe() com uma inscrição já ativa não
    // cria duplicata no navegador, mas evita uma chamada de rede
    // desnecessária e deixa a intenção explícita no código.
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!chavePublica) return 'erro';

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveVapidParaUint8Array(chavePublica) as BufferSource,
      });
    }

    const registrado = await registrarInscricaoNoServidor(subscription);
    return registrado ? 'inscrita' : 'erro';
  } catch {
    return 'erro';
  }
}

export async function desinscreverPush(): Promise<boolean> {
  if (!suportaPush()) return true;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    const cancelada = await subscription.unsubscribe();
    if (!cancelada) return false;

    const resposta = await fetch('/api/push/desinscrever', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}
