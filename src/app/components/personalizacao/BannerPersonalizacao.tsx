'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { dispensarPersonalizacao } from '@/app/onboarding/actions';

export default function BannerPersonalizacao({ aoDispensar }: { aoDispensar: () => void }) {
  const [dispensando, startTransition] = useTransition();

  function handleDispensar() {
    startTransition(async () => {
      await dispensarPersonalizacao();
      aoDispensar();
    });
  }

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4 space-y-3">
      <p className="text-sm text-texto">
        <span className="font-medium">Personalize sua experiência.</span> Conte seus objetivos e temas
        sensíveis para deixar seu ritual diário mais seu.
      </p>
      <div className="flex gap-3">
        <Link
          href="/perfil/personalizacao"
          className="flex-1 rounded-2xl bg-acao p-3 text-center text-sm font-medium text-white transition-colors hover:bg-acao/90"
        >
          Personalizar agora
        </Link>
        <button
          type="button"
          onClick={handleDispensar}
          disabled={dispensando}
          className="flex-1 rounded-2xl border border-borda p-3 text-center text-sm font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          {dispensando ? 'Dispensando...' : 'Agora não'}
        </button>
      </div>
    </div>
  );
}
