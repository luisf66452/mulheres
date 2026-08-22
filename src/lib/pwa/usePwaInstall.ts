'use client';

import { useCallback, useEffect, useState } from 'react';

const CHAVE_DISPENSADO = 'rose-pwa-dispensado';

type EventoBeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function detectarIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ehIOSClassico = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se reporta como "Macintosh" com suporte a touch.
  const ehIPadOSComoMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return ehIOSClassico || ehIPadOSComoMac;
}

function detectarStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const viaMatchMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const viaIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return viaMatchMedia || viaIOS;
}

export function usePwaInstall() {
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoBeforeInstallPrompt | null>(
    null
  );
  const [foiDispensado, setFoiDispensado] = useState(false);
  const [ehStandalone, setEhStandalone] = useState(false);
  const [ehIOS, setEhIOS] = useState(false);

  useEffect(() => {
    setFoiDispensado(window.localStorage.getItem(CHAVE_DISPENSADO) === '1');
    setEhStandalone(detectarStandalone());
    setEhIOS(detectarIOS());

    function aoCapturarPrompt(evento: Event) {
      evento.preventDefault();
      setEventoInstalacao(evento as EventoBeforeInstallPrompt);
    }

    function aoInstalar() {
      setEventoInstalacao(null);
      setEhStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', aoCapturarPrompt);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoCapturarPrompt);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!eventoInstalacao) return;
    await eventoInstalacao.prompt();
    await eventoInstalacao.userChoice;
    setEventoInstalacao(null);
  }, [eventoInstalacao]);

  const dispensar = useCallback(() => {
    window.localStorage.setItem(CHAVE_DISPENSADO, '1');
    setFoiDispensado(true);
  }, []);

  return {
    podeInstalar: eventoInstalacao !== null,
    ehIOS,
    ehStandalone,
    foiDispensado,
    instalar,
    dispensar,
  };
}
