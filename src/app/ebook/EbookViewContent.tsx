'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento, aoFbqFicarDisponivel } from '@/lib/meta/eventos';

// PageView já é disparado globalmente (ver FacebookPageView no layout raiz) —
// este componente cobre só o ViewContent específico do produto, que o pixel
// base não sabe fazer sozinho. Usa aoFbqFicarDisponivel em vez de disparar
// direto no mount porque o pixel só carrega depois da usuária aceitar o
// banner de cookies — sem isso, o ViewContent quase sempre perderia a
// corrida contra essa decisão e nunca seria reenviado.
export default function EbookViewContent() {
  const jaDisparou = useRef(false);

  useEffect(() => {
    return aoFbqFicarDisponivel(() => {
      if (jaDisparou.current) return;
      jaDisparou.current = true;
      rastrearEvento('ViewContent', {
        content_name: 'Guia Rose — Ebook 21 dias',
        value: 29.99,
        currency: 'BRL',
      });
    });
  }, []);

  return null;
}
