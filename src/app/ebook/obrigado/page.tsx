import { obterStripe } from '@/lib/stripe/client';
import { obterDownloadEbook } from '@/lib/stripe/ebook';

export default async function EbookObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let confirmado = false;
  let urlDownload: string | null = null;

  if (sessionId) {
    const stripe = obterStripe();
    if (stripe) {
      const resultado = await obterDownloadEbook(stripe, sessionId);
      confirmado = resultado.confirmado;
      urlDownload = resultado.urlDownload;
    }
  }

  if (!confirmado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-medium text-texto">Não encontramos sua compra</h1>
        <p className="text-texto-suave">
          Se você acabou de pagar, aguarde alguns segundos e recarregue a página. Se o problema continuar, entre em
          contato pelo email de suporte.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-display text-2xl font-medium text-texto">Sua compra foi confirmada!</h1>

      {urlDownload ? (
        <a
          href={urlDownload}
          className="w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          Baixar meu ebook
        </a>
      ) : (
        <p className="text-texto-suave">
          Seu pagamento foi confirmado, mas não conseguimos gerar o link de download agora. Entre em contato pelo
          email de suporte que resolvemos rapidinho.
        </p>
      )}

      <div className="mt-4 space-y-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-texto-suave">
        <p>Gostou? O Rose Pro leva sua transformação ainda mais longe, com jornadas guiadas todo dia.</p>
        <a href="/comecar" className="font-medium text-acao underline">
          Conhecer o Rose Pro
        </a>
      </div>
    </main>
  );
}
