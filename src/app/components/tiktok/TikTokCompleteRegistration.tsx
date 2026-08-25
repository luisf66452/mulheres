'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado } from '@/lib/tiktok/eventos';

const CHAVE_DEDUP = 'complete_registration';

// Montado na Home só quando a usuária chega de '/?cadastro=concluido' (ver
// confirmarPais em src/app/onboarding/actions.ts — único ponto do app em que
// o cadastro é concluído de fato). Dispara o evento uma única vez por
// navegador (localStorage, cadastro só acontece uma vez por conta). O
// parâmetro da URL fica sob responsabilidade da oferta Rose Pro: removê-lo
// aqui fecharia o diálogo antes de a usuária escolher uma opção.
export default function TikTokCompleteRegistration() {
  const disparouNestaMontagem = useRef(false);

  useEffect(() => {
    if (disparouNestaMontagem.current) return;
    disparouNestaMontagem.current = true;

    if (!jaDisparado(CHAVE_DEDUP)) {
      rastrearEvento('CompleteRegistration', {});
      marcarDisparado(CHAVE_DEDUP);
    }

  }, []);

  return null;
}
