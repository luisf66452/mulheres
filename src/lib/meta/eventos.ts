// Helpers de client para disparar eventos no `window.fbq` já carregado pelo
// pixel base (ver src/app/components/FacebookPixel.tsx). Nunca envia PII
// (email/telefone/external_id) nem dado de saúde mental/jornada — só os
// parâmetros mínimos que o Meta Ads pede (value/currency). O dedup por
// localStorage evita reenvio em reload de página ou em nova visita à mesma
// URL de retorno do Stripe.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function rastrearEvento(evento: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', evento, params);
}

// PageView em navegação client-side (App Router não recarrega a página, então
// o fbq('track', 'PageView') do script base — que só roda no carregamento
// inicial — nunca dispara de novo sozinho nas trocas de rota seguintes). Ver
// FacebookPageView.tsx, que chama isso a cada mudança de pathname.
export function rastrearPageView(): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

const PREFIXO_CHAVE_DEDUP = 'rose_fbq_evento:';

// Marca eventos que só devem ser contados uma única vez por navegador (ex.:
// CompleteRegistration) ou uma única vez por transação (ex.: Subscribe,
// usando o id da sessão do Stripe como `chave`).
export function jaDisparado(chave: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(PREFIXO_CHAVE_DEDUP + chave) === '1';
  } catch {
    // Storage indisponível (modo privado etc.) — trata como não disparado
    // ainda; pior caso é um possível reenvio, não uma quebra da página.
    return false;
  }
}

export function marcarDisparado(chave: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIXO_CHAVE_DEDUP + chave, '1');
  } catch {
    // Ignora falha de storage — não é crítico para o funcionamento do app.
  }
}
