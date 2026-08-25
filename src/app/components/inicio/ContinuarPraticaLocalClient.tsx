'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import { chaveRascunhoPratica } from '@/lib/praticas-progresso/chaveLocal';

interface CandidatoRascunho {
  chaveCategoria: 'diario' | 'autocompaixao';
  titulo: string;
  rota: string;
}

// Só diário guiado e autocompaixão guardam rascunho local (usePersistedState);
// respiração e meditação são cronômetro/sessão única, sem texto para recuperar.
const CANDIDATOS: CandidatoRascunho[] = [
  { chaveCategoria: 'diario', titulo: 'Diário guiado', rota: '/praticas/diario-guiado' },
  { chaveCategoria: 'autocompaixao', titulo: 'Autocompaixão', rota: '/praticas/autocompaixao' },
];

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ContinuarPraticaLocalClient({ usuariaId }: { usuariaId: string }) {
  const [rascunho, setRascunho] = useState<{ titulo: string; rota: string } | null>(null);

  useEffect(() => {
    for (const candidato of CANDIDATOS) {
      const chave = chaveRascunhoPratica(candidato.chaveCategoria, usuariaId, dataDeHoje());
      let bruto: string | null = null;
      try {
        bruto = window.localStorage.getItem(chave);
      } catch {
        continue;
      }
      if (!bruto) continue;

      try {
        const respostas = JSON.parse(bruto) as unknown;
        if (Array.isArray(respostas) && respostas.some((r) => typeof r === 'string' && r.trim().length > 0)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com localStorage (sistema externo), mesmo padrão de usePersistedState.
          setRascunho({ titulo: candidato.titulo, rota: candidato.rota });
          return;
        }
      } catch {
        continue;
      }
    }
  }, [usuariaId]);

  if (!rascunho) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Continue de onde parou</p>
      <Link href={rascunho.rota} className="block">
        <Cartao className="space-y-1 transition-colors hover:bg-fundo">
          <p className="font-display text-base text-texto">{rascunho.titulo}</p>
          <p className="text-sm text-texto-suave">Você tem um rascunho salvo neste dispositivo.</p>
        </Cartao>
      </Link>
    </div>
  );
}
