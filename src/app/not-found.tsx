import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-2xl text-texto">Não encontramos essa página</h1>
      <p className="text-texto-suave">O link pode estar incorreto ou o conteúdo não está mais disponível.</p>
      <Link
        href="/checkin"
        className="rounded-2xl border border-borda bg-superficie px-4 py-3 text-texto-suave transition-colors hover:bg-superficie/70"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
