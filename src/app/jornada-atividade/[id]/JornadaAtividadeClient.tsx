'use client';

import { registrarSessaoJornada } from './actions';
import AntesDepoisAtividade from '@/app/components/AntesDepoisAtividade';
import type { JornadaAtividade } from '@/lib/supabase/types';

export default function JornadaAtividadeClient({
  atividade,
  checkinId,
}: {
  atividade: JornadaAtividade;
  checkinId: string;
}) {
  return (
    <AntesDepoisAtividade
      titulo={atividade.titulo}
      conteudo={atividade.conteudo}
      aoFinalizar={(sensacaoAntes, sensacaoDepois) =>
        registrarSessaoJornada({
          checkinId,
          jornadaAtividadeId: atividade.id,
          sensacaoAntes,
          sensacaoDepois,
        })
      }
    />
  );
}
