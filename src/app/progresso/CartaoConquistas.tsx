// src/app/progresso/CartaoConquistas.tsx
'use client';

import { useEffect, useState } from 'react';
import { avaliarConquistas } from '@/lib/conquistas/definicoes';
import { obterVistas, registrarVistas } from '@/lib/conquistas/armazenamentoVistas';
import type { ConquistaAvaliada, IconeConquista } from '@/lib/conquistas/tipos';

function IconeSequencia({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20c0-6 1-10 1-14" />
      <path d="M13 10c-3-1-5 0-6 2" />
      <path d="M13 6c3 0 4-1.5 4-4" />
    </svg>
  );
}

function IconeCheckin({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" className={className}>
      <path
        d="M12 4c-4 3-7 4-7 9a7 7 0 0 0 14 0c0-5-3-6-7-9z"
        fill="currentColor"
        fillOpacity="0.7"
      />
    </svg>
  );
}

function IconeCoracao({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className={className}>
      <path d="M12 20s-7-4.4-9.5-9C.8 7.4 3 4 6.5 4c2 0 3.5 1.2 5.5 3.6C14 5.2 15.5 4 17.5 4 21 4 23.2 7.4 21.5 11 19 15.6 12 20 12 20z" />
    </svg>
  );
}

const ICONES: Record<IconeConquista, typeof IconeSequencia> = {
  sequencia: IconeSequencia,
  checkin: IconeCheckin,
  pratica: IconeCoracao,
};

const CIRCULOS: Record<IconeConquista, string> = {
  sequencia: 'bg-salvia-suave text-salvia',
  checkin: 'bg-pessego-suave text-pessego',
  pratica: 'bg-acao/15 text-acao',
};

export default function CartaoConquistas({
  usuariaId,
  melhorSequencia,
  totalCheckins,
  totalPraticasCuradas,
  totalPraticasRapidas,
}: {
  usuariaId: string;
  melhorSequencia: number;
  totalCheckins: number;
  totalPraticasCuradas: number;
  // Contado no servidor (conclusoes_praticas_conteudo) em vez de lido do
  // localStorage no cliente — ver src/lib/praticas-progresso/armazenamento.ts.
  totalPraticasRapidas: number;
}) {
  const [recemDesbloqueadas, setRecemDesbloqueadas] = useState<Set<string>>(new Set());

  const conquistas: ConquistaAvaliada[] = avaliarConquistas({
    melhorSequencia,
    totalCheckins,
    totalPraticasConcluidas: totalPraticasCuradas + totalPraticasRapidas,
  });

  useEffect(() => {
    const desbloqueadasAgora = conquistas.filter((c) => c.desbloqueada).map((c) => c.id);
    const vistas = obterVistas(usuariaId);
    const novas = desbloqueadasAgora.filter((id) => !vistas.has(id));
    if (novas.length > 0) {
      // Mesmo padrão de usePersistedState.ts: sincroniza estado do React com o
      // localStorage (sistema externo) — não é um espelhamento comum de prop-em-state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecemDesbloqueadas(new Set(novas));
      registrarVistas(usuariaId, desbloqueadasAgora);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPraticasRapidas, usuariaId]);

  return (
    <div className="rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <h2 className="font-display text-lg text-texto">Conquistas</h2>
      <ul className="mt-2">
        {conquistas.map((conquista, indice) => {
          const Icone = ICONES[conquista.icone];
          const celebrando = recemDesbloqueadas.has(conquista.id);
          return (
            <li
              key={conquista.id}
              className={`flex items-center gap-3 py-3 ${indice > 0 ? 'border-t border-borda' : ''} ${
                celebrando ? 'motion-safe:animate-[conquista-celebrar_0.6s_ease-out]' : ''
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  CIRCULOS[conquista.icone]
                } ${conquista.desbloqueada ? '' : 'opacity-50'}`}
              >
                <Icone />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-display text-base ${conquista.desbloqueada ? 'text-texto' : 'text-texto-suave'}`}>
                  <span className="sr-only">
                    {conquista.desbloqueada ? 'Conquista desbloqueada: ' : 'Conquista bloqueada: '}
                  </span>
                  {conquista.titulo}
                </span>
                <span className="block text-sm text-texto-suave">
                  {conquista.desbloqueada ? conquista.descricao : `${conquista.atual} de ${conquista.meta}`}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-texto-suave">
                ›
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
