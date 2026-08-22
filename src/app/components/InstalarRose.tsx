'use client';

import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

export default function InstalarRose({ variante }: { variante: 'banner' | 'compacto' }) {
  const { podeInstalar, ehIOS, ehStandalone, foiDispensado, instalar, dispensar } =
    usePwaInstall();

  if (ehStandalone) return null;
  if (variante === 'banner' && foiDispensado) return null;
  if (!podeInstalar && !ehIOS) return null;

  return (
    <section
      aria-label="Instalar a Rose"
      className="space-y-3 rounded-2xl border border-borda bg-superficie p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base text-texto">Instale a Rose no seu aparelho</p>
          <p className="text-sm text-texto-suave">
            Acesso rápido direto da tela inicial, como um app.
          </p>
        </div>
        {variante === 'banner' && (
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar aviso de instalação"
            className="shrink-0 rounded-full p-1 text-texto-suave hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
          >
            ✕
          </button>
        )}
      </div>

      {podeInstalar && (
        <button
          type="button"
          onClick={instalar}
          className="w-full rounded-2xl bg-acao px-4 py-3 text-center font-medium text-white hover:bg-acao/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
        >
          Instalar Rose
        </button>
      )}

      {ehIOS && (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-texto-suave">
          <li>Abra a Rose no Safari.</li>
          <li>Toque no botão Compartilhar.</li>
          <li>Toque em &ldquo;Adicionar à Tela de Início&rdquo;.</li>
          <li>Ative &ldquo;Abrir como App&rdquo;, caso essa opção apareça.</li>
          <li>Toque em &ldquo;Adicionar&rdquo;.</li>
        </ol>
      )}
    </section>
  );
}
