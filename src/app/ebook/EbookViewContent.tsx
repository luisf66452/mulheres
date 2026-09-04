'use client';

import { useEffect, useRef } from 'react';
import { rastrearEvento } from '@/lib/meta/eventos';

// PageView já é disparado globalmente (ver FacebookPageView no layout raiz) —
// este componente cobre só o ViewContent específico do produto, que o pixel
// base não sabe fazer sozinho.
export default function EbookViewContent() {
  const jaDisparou = useRef(false);

  useEffect(() => {
    if (jaDisparou.current) return;
    jaDisparou.current = true;
    rastrearEvento('ViewContent', {
      content_name: 'Guia Rose — Ebook 21 dias',
      value: 29.99,
      currency: 'BRL',
    });
  }, []);

  return null;
}
