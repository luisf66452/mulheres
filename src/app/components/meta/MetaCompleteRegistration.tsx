'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, jaDisparado, marcarDisparado, aoFbqFicarDisponivel } from '@/lib/meta/eventos';

const CHAVE_DEDUP = 'complete_registration';

// Montado na Home junto com TikTokCompleteRegistration, só quando a usuária
// chega de '/?cadastro=concluido' (ver concluirPersonalizacao em
// src/app/onboarding/actions.ts — único ponto do app em que o cadastro é
// concluído de fato). Dispara o evento uma única vez por navegador
// (localStorage, cadastro só acontece uma vez por conta). Não mexe na URL —
// quem remove o parâmetro '?cadastro=concluido' é TikTokCompleteRegistration,
// montado ao lado. Usa aoFbqFicarDisponivel (em vez de disparar direto no
// mount) e só marca como disparado depois do disparo de fato acontecer —
// senão, quando o Meta Pixel ainda não carregou (sem consentimento de
// marketing, o caso comum logo na chegada à página), o evento seria marcado
// como "já disparado" pra sempre sem nunca ter sido enviado de verdade.
export default function MetaCompleteRegistration() {
  const disparouNestaMontagem = useRef(false);

  useEffect(() => {
    if (jaDisparado(CHAVE_DEDUP)) return;

    return aoFbqFicarDisponivel(() => {
      if (disparouNestaMontagem.current) return;
      disparouNestaMontagem.current = true;
      rastrearEvento('CompleteRegistration', {});
      marcarDisparado(CHAVE_DEDUP);
    });
  }, []);

  return null;
}
