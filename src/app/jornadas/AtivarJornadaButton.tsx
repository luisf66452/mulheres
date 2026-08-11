'use client';

import { ativarJornada } from './actions';

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
      <button disabled className="w-full rounded border border-black p-3 text-center opacity-60">
        Jornada atual
      </button>
    );
  }

  return (
    <button
      onClick={() => ativarJornada(jornadaId)}
      className="w-full rounded bg-black p-3 text-white"
    >
      {label}
    </button>
  );
}
