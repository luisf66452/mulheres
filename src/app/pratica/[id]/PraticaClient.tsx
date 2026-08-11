'use client';

import { registrarSessao } from './actions';
import AntesDepoisAtividade from '@/app/components/AntesDepoisAtividade';
import type { Pratica } from '@/lib/supabase/types';

export default function PraticaClient({
  pratica,
  checkinId,
}: {
  pratica: Pratica;
  checkinId: string;
}) {
  return (
    <AntesDepoisAtividade
      titulo={pratica.titulo}
      conteudo={pratica.conteudo}
      aoFinalizar={(sensacaoAntes, sensacaoDepois) =>
        registrarSessao({
          checkinId,
          praticaId: pratica.id,
          sensacaoAntes,
          sensacaoDepois,
        })
      }
    />
  );
}
