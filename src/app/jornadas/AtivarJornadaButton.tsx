'use client';

import { ativarJornada } from './actions';
import Botao from '@/app/components/Botao';

export default function AtivarJornadaButton({
  jornadaId,
  jaAtiva,
  label,
}: {
  jornadaId: string;
  jaAtiva: boolean;
  label: string;
}) {
  if (jaAtiva) {
    return (
      <Botao disabled variante="secundaria">
        Jornada atual
      </Botao>
    );
  }

  return <Botao onClick={() => ativarJornada(jornadaId)}>{label}</Botao>;
}
