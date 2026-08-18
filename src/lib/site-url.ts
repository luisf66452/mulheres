import { headers } from 'next/headers';

// URL base do app, resolvida em runtime a partir do request — funciona sem
// alteração em development, preview e production (cada deploy da Vercel tem
// seu próprio host). NEXT_PUBLIC_SITE_URL só é usado como fallback para
// contextos sem request (ex.: jobs fora de uma rota HTTP).
export async function obterUrlBaseDoRequest(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  if (origin) return origin;

  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  if (host) {
    const proto = headersList.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
