'use client';

import { useEffect, useState } from 'react';
import { LIMITE_PETALAS_GRATUITO } from '@/lib/clube-rose/config';

export default function NotificacaoLimitePetalas() {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisivel(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visivel) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="notificacao-petalas fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_1rem)] z-50 mx-auto w-fit max-w-[90vw] rounded-2xl bg-acao px-4 py-3 text-center text-sm font-medium text-white shadow-[0_4px_16px_rgba(74,63,53,0.16)]"
    >
      <p>Você atingiu o limite gratuito de {LIMITE_PETALAS_GRATUITO} Pétalas.</p>
      <a href="/premium" className="mt-1 inline-block underline">
        Vire Premium para continuar ganhando
      </a>
    </div>
  );
}
