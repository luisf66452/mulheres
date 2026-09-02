'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import IlustracaoBotanica from '@/app/components/decoracao/IlustracaoBotanica';
import RosasDecorativas from '@/app/components/decoracao/RosasDecorativas';
import SeloProvaSocial from '@/app/components/inicio/SeloProvaSocial';
import { lerRespostasQuiz } from '@/lib/quiz/armazenamento';
import {
  ajusteParaTemasSensiveis,
  confirmacaoParaTempoDisponivel,
  headlineParaObjetivo,
  validacaoParaIdentificacao,
} from '@/lib/quiz/copyResultado';
import type { RespostasQuiz } from '@/lib/quiz/tipos';

// lerRespostasQuiz lê localStorage, que não existe durante o SSR de page.tsx
// (Server Component) — useSyncExternalStore com getServerSnapshot fixo em
// null garante que o HTML do servidor e o primeiro render do cliente batam,
// evitando o aviso de hidratação (mesmo padrão de
// consentimentoMarketing.ts + FacebookPixel.tsx). Não há evento externo real
// para assinar aqui, então subscribe é um no-op.
function inscrever(): () => void {
  return () => {};
}

function obterRespostasNoServidor(): RespostasQuiz | null {
  return null;
}

export default function ResultadoClient({
  precoMensal,
  precoAnual,
  percentualEconomiaAnual,
}: {
  precoMensal: string | null;
  precoAnual: string | null;
  percentualEconomiaAnual: number | null;
}) {
  const router = useRouter();
  const respostas = useSyncExternalStore(inscrever, lerRespostasQuiz, obterRespostasNoServidor);

  useEffect(() => {
    if (!respostas) {
      router.replace('/comecar');
    }
  }, [respostas, router]);

  if (!respostas) return null;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
      <IlustracaoBotanica tamanho="compacto" />
      <RosasDecorativas tamanho="compacto" />
      <h1 className="relative text-center font-display text-2xl text-texto">
        {headlineParaObjetivo(respostas.objetivo)}
      </h1>
      <p className="relative text-center text-texto-suave">{validacaoParaIdentificacao(respostas.identificacao)}</p>
      <p className="relative text-center text-texto-suave">{ajusteParaTemasSensiveis(respostas.temasSensiveis)}</p>
      <p className="relative text-center font-medium text-texto">
        {confirmacaoParaTempoDisponivel(respostas.tempoDisponivel)}
      </p>

      <div className="relative flex justify-center">
        <SeloProvaSocial />
      </div>

      {(precoMensal || precoAnual) && (
        <div className="relative space-y-1 text-center text-sm text-texto-suave">
          {precoMensal && <p>Mensal: {precoMensal}</p>}
          {precoAnual && (
            <p>
              Anual: {precoAnual}
              {percentualEconomiaAnual ? ` (economize ${percentualEconomiaAnual}%)` : ''}
            </p>
          )}
          <p className="text-center text-xs text-texto-suave">
            Preço de referência para o Brasil — o valor final é confirmado no seu país ao criar a conta.
          </p>
        </div>
      )}

      <p className="relative text-center text-xs text-texto-suave">Cancele quando quiser, sem multa.</p>

      <Botao type="button" onClick={() => router.push('/login')} className="relative">
        Quero começar agora
      </Botao>
    </main>
  );
}
