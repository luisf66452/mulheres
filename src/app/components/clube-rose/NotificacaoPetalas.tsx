'use client';

import { useEffect, useState } from 'react';

export default function NotificacaoPetalas({ quantidade }: { quantidade: number }) {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisivel(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visivel || quantidade <= 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="notificacao-petalas fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_1rem)] z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-acao px-4 py-2 text-center text-sm font-medium text-white shadow-[0_4px_16px_rgba(74,63,53,0.16)]"
    >
      +{quantidade} Pétalas — seu cuidado está florescendo.
    </div>
  );
}
