// Conversão da chave pública VAPID (base64url, formato retornado pela
// biblioteca `web-push`) para o Uint8Array que PushManager.subscribe exige
// em `applicationServerKey`. Alguns navegadores aceitam a string base64url
// diretamente como conveniência, mas isso não é garantido pela spec —
// converter explicitamente é o que a documentação oficial recomenda
// (https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe).
export function chaveVapidParaUint8Array(chaveBase64Url: string): Uint8Array {
  const preenchimento = '='.repeat((4 - (chaveBase64Url.length % 4)) % 4);
  const base64 = (chaveBase64Url + preenchimento).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(base64);
  const saida = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) {
    saida[i] = bruto.charCodeAt(i);
  }
  return saida;
}
