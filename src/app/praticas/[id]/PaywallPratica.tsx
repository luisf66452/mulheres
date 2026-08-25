import Link from 'next/link';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';

export default function PaywallPratica({ titulo, categoria }: { titulo: string; categoria: string }) {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <span className="text-xs font-medium uppercase tracking-wide text-destaque">{categoria}</span>
      <h1 className="font-display text-2xl text-texto">{titulo}</h1>
      <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
        <p className="text-sm text-texto">Esta prática faz parte do Rose Pro.</p>
        <Link
          href="/premium"
          className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
        >
          Conhecer o Rose Pro
        </Link>
      </div>
      <Link
        href="/praticas"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Voltar para a biblioteca
      </Link>
      <NavegacaoInferior />
    </main>
  );
}
