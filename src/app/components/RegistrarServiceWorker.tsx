'use client';

import { useEffect } from 'react';

// Registra o service worker so em producao (evita cache brigando com o
// Fast Refresh do `next dev`) e so depois do `load`, pra nao competir com o
// carregamento inicial da pagina por banda/CPU.
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    function registrar() {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falha de registro nao deve quebrar a navegacao normal do app.
      });
    }

    window.addEventListener('load', registrar);
    return () => window.removeEventListener('load', registrar);
  }, []);

  return null;
}
