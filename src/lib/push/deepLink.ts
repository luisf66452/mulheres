// Mesma regra aplicada em dois lugares: aqui (servidor, ao montar o payload
// antes de enfileirar/enviar) e em public/sw.js (cliente, ao decidir pra onde
// abrir a janela). Nunca aceitar um link absoluto/externo — só caminhos
// relativos de uma única barra, nunca "//" (protocolo-relativo).
export function ehDeepLinkSeguro(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

/** Devolve `url` se for um deep link seguro, senão `fallback`. */
export function deepLinkSeguro(url: string | null | undefined, fallback = '/inicio'): string {
  if (typeof url === 'string' && ehDeepLinkSeguro(url)) return url;
  return fallback;
}
