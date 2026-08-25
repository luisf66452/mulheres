// Consentimento para cookies/pixels de marketing (ex.: Meta Pixel). Guardado
// em localStorage — decisão por navegador, não por conta, já que o pixel
// carrega antes de qualquer autenticação. Dispara um evento customizado para
// componentes já montados (ex.: FacebookPixel) reagirem sem precisar de
// reload da página quando a usuária aceita depois do carregamento inicial.

const CHAVE = 'rose_consentimento_marketing';

export type ConsentimentoMarketing = 'aceito' | 'recusado';
export type EstadoConsentimentoMarketing = ConsentimentoMarketing | 'indefinido';

export const EVENTO_CONSENTIMENTO_MARKETING = 'rose:consentimento-marketing';

export function obterConsentimentoMarketing(): EstadoConsentimentoMarketing {
  if (typeof window === 'undefined') return 'indefinido';
  try {
    const valor = window.localStorage.getItem(CHAVE);
    if (valor === 'aceito' || valor === 'recusado') return valor;
  } catch {
    // Storage indisponível (modo privado etc.) — trata como indefinido, o
    // que mantém o pixel desligado (opção mais segura para privacidade).
  }
  return 'indefinido';
}

export function definirConsentimentoMarketing(valor: ConsentimentoMarketing): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAVE, valor);
  } catch {
    // Ignora falha de storage — a escolha só não persiste entre sessões.
  }
  window.dispatchEvent(new CustomEvent<ConsentimentoMarketing>(EVENTO_CONSENTIMENTO_MARKETING, { detail: valor }));
}

// Para useSyncExternalStore (ver ConsentimentoMarketingBanner.tsx e
// FacebookPixel.tsx) — evita setState direto dentro de useEffect para ler um
// valor de fora do React (localStorage), que causa uma renderização em
// cascata desnecessária.
export function inscreverConsentimentoMarketing(callback: () => void): () => void {
  window.addEventListener(EVENTO_CONSENTIMENTO_MARKETING, callback);
  return () => window.removeEventListener(EVENTO_CONSENTIMENTO_MARKETING, callback);
}

export function obterConsentimentoMarketingNoServidor(): EstadoConsentimentoMarketing {
  return 'indefinido';
}
