'use client';

import { useState } from 'react';
import Link from 'next/link';
import RostoHumor from './rostos/RostoHumor';
import { ROTULO_HUMOR, type DiaSemana } from '@/lib/progress/semana';

const ABREVIACOES = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const NOMES_COMPLETOS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

function formatarDataPorExtenso(iso: string): string {
  const data = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(data);
}

export default function HumorSemana({
  dias,
  hojeISO,
  hrefSemanaAnterior,
  hrefSemanaSeguinte,
}: {
  dias: DiaSemana[];
  hojeISO: string;
  hrefSemanaAnterior: string;
  hrefSemanaSeguinte: string | null;
}) {
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null);
  const semNenhumRegistro = dias.every((dia) => dia.humor === null);
  const diaSelecionado = diaExpandido ? dias.find((d) => d.data === diaExpandido) : undefined;

  return (
    <div className="rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-texto">Seu humor na semana</h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/progresso?semana=${hrefSemanaAnterior}`}
            aria-label="Ver semana anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
          >
            ‹
          </Link>
          {hrefSemanaSeguinte ? (
            <Link
              href={`/progresso?semana=${hrefSemanaSeguinte}`}
              aria-label="Ver próxima semana"
              className="flex h-11 w-11 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
            >
              ›
            </Link>
          ) : (
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center text-borda">
              ›
            </span>
          )}
        </div>
      </div>

      {semNenhumRegistro ? (
        <p className="mt-3 text-sm text-texto-suave">
          Faça seu primeiro check-in para começar a acompanhar seu humor.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-7 gap-1">
          {dias.map((dia, indice) => {
            const ehHoje = dia.data === hojeISO;
            const temRegistro = dia.humor !== null;
            const diaDoMes = Number(dia.data.slice(8, 10));
            const conteudo = (
              <>
                <span className="text-[10px] font-medium text-texto-suave">{ABREVIACOES[indice]}</span>
                {temRegistro ? (
                  <RostoHumor nivel={dia.humor as 1 | 2 | 3 | 4 | 5} className="mx-auto" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="mx-auto block h-7 w-7 rounded-full border border-dashed border-borda"
                  />
                )}
                <span className="text-[11px] text-texto-suave">{diaDoMes}</span>
              </>
            );

            const rotuloBase = temRegistro
              ? `${NOMES_COMPLETOS[indice]}, ${formatarDataPorExtenso(dia.data)}, humor: ${
                  ROTULO_HUMOR[dia.humor as number]
                }`
              : `${NOMES_COMPLETOS[indice]}, ${formatarDataPorExtenso(dia.data)}, sem registro`;

            if (temRegistro) {
              return (
                <button
                  key={dia.data}
                  type="button"
                  aria-label={rotuloBase}
                  aria-expanded={diaExpandido === dia.data}
                  onClick={() => setDiaExpandido((atual) => (atual === dia.data ? null : dia.data))}
                  className={`flex flex-col items-center gap-1 rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 ${
                    ehHoje ? 'bg-fundo' : ''
                  }`}
                >
                  {conteudo}
                </button>
              );
            }

            if (ehHoje) {
              return (
                <Link
                  key={dia.data}
                  href="/checkin"
                  aria-label={`${rotuloBase}. Toque para fazer o check-in de hoje.`}
                  className="flex flex-col items-center gap-1 rounded-xl bg-fundo py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
                >
                  {conteudo}
                </Link>
              );
            }

            return (
              <div key={dia.data} aria-label={rotuloBase} className="flex flex-col items-center gap-1 py-1">
                {conteudo}
              </div>
            );
          })}
        </div>
      )}

      {diaSelecionado && diaSelecionado.humor !== null && (
        <p className="mt-3 rounded-xl bg-fundo p-3 text-sm text-texto">
          {formatarDataPorExtenso(diaSelecionado.data)} — {ROTULO_HUMOR[diaSelecionado.humor]}
        </p>
      )}
    </div>
  );
}
