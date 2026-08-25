'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado } from '@/lib/meta/eventos';

const CHAVE_DEDUP = 'complete_registration';

// Montado na Home junto com TikTokCompleteRegistration, só quando a usuária
// chega de '/?cadastro=concluido' (ver concluirPersonalizacao em
// src/app/onboarding/actions.ts — único ponto do app em que o cadastro é
// concluído de fato). Dispara o evento uma única vez por navegador
// (localStorage, cadastro só acontece uma vez por conta). Não mexe na URL —
// quem remove o parâmetro '?cadastro=concluido' é TikTokCompleteRegistration,
// montado ao lado; se o Meta Pixel ainda não carregou (sem consentimento de
// marketing), rastrearEvento() é um no-op e o evento simplesmente não é
// enviado, sem quebrar a página.
export default function MetaCompleteRegistration() {
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
