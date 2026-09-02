'use client';

import { useEffect, useState } from 'react';
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

const VANTAGENS = [
  'Todas as jornadas guiadas, no seu ritmo',
  'Biblioteca completa de práticas de autocuidado',
  'Insights semanais sobre seus padrões',
  'Conteúdos novos toda semana',
  'Recompensas exclusivas no Clube Rose',
];

export default function ResultadoClient({
  precoMensal,
  precoAnual,
  percentualEconomiaAnual,
  precoAnualPorMes,
  precoMensalPorDia,
}: {
  precoMensal: string | null;
  precoAnual: string | null;
  percentualEconomiaAnual: number | null;
  precoAnualPorMes?: string | null;
  precoMensalPorDia?: string | null;
}) {
  const router = useRouter();
  // `undefined` = ainda não checou o localStorage no cliente; `null` = checou
  // e não tem respostas salvas. lerRespostasQuiz só é chamado dentro do
  // useEffect (nunca durante o render) porque localStorage não existe no SSR
  // de page.tsx (Server Component) — ler direto no corpo do componente, via
  // useSyncExternalStore com getServerSnapshot fixo em null, causava um
  // redirect prematuro para /comecar: o efeito de redirect via respostas
  // ainda null do primeiro paint corria antes da correção de hidratação do
  // React reler o valor real do client, redirecionando mesmo com dados
  // válidos salvos.
  const [respostas, setRespostas] = useState<RespostasQuiz | null | undefined>(undefined);

  useEffect(() => {
    const dados = lerRespostasQuiz();
    setRespostas(dados);
    if (!dados) {
      router.replace('/comecar');
    }
  }, [router]);

  if (!respostas) return null;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
      <div className="resultado-blob h-64 w-64 -top-16 -right-12 bg-creme-rosado" />
      <div className="resultado-blob h-52 w-52 -bottom-12 -left-12 bg-salvia-suave" style={{ animationDelay: '1.2s' }} />

      <div className="resultado-decoracao">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
      </div>

      <div className="resultado-bloco resultado-bloco-1 relative flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-creme-rosado/60 px-3.5 py-1.5 text-xs font-semibold text-acao">
          ✦ Seu plano personalizado está pronto
        </span>
      </div>

      <div className="resultado-bloco resultado-bloco-2 relative space-y-2.5">
        <h1 className="text-center font-display text-[1.75rem] font-medium leading-tight tracking-tight text-texto sm:text-3xl">
          {headlineParaObjetivo(respostas.objetivo)}
        </h1>
        <p className="text-center leading-relaxed text-texto-suave">
          {validacaoParaIdentificacao(respostas.identificacao)}
        </p>
        <p className="text-center leading-relaxed text-texto-suave">
          {ajusteParaTemasSensiveis(respostas.temasSensiveis)}
        </p>
        <p className="text-center font-medium leading-relaxed text-texto">
          {confirmacaoParaTempoDisponivel(respostas.tempoDisponivel)}
        </p>
      </div>

      <div className="resultado-bloco resultado-bloco-3 relative flex justify-center">
        <SeloProvaSocial animado icone="♥" texto="+500 mulheres já transformaram sua relação com a comida" />
      </div>

      <div className="resultado-bloco resultado-bloco-4 relative space-y-2.5 rounded-2xl border border-borda bg-superficie/70 p-4">
        <p className="text-center text-sm font-semibold text-texto">Assinando o Rose Pro, você também tem:</p>
        <ul className="space-y-2 text-sm text-texto">
          {VANTAGENS.map((vantagem) => (
            <li key={vantagem} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-salvia-suave text-xs text-texto"
              >
                ✓
              </span>
              <span className="leading-snug">{vantagem}</span>
            </li>
          ))}
        </ul>
      </div>

      {(precoMensal || precoAnual) && (
        <div className="resultado-bloco resultado-bloco-5 relative space-y-3 rounded-2xl border border-acao/25 bg-creme-rosado/35 p-4 text-center">
          {precoAnual && (
            <div className="space-y-1">
              {percentualEconomiaAnual ? (
                <span className="inline-flex rounded-full bg-acao/10 px-3 py-1 text-xs font-semibold tracking-wide text-acao uppercase">
                  Melhor custo-benefício
                </span>
              ) : null}
              <p className="font-display text-3xl font-medium tracking-tight text-texto tabular-nums">
                {precoAnualPorMes ?? precoAnual}
                <span className="text-sm font-sans font-normal text-texto-suave"> /mês no plano anual</span>
              </p>
              <p className="text-xs text-texto-suave">
                Cobrado {precoAnual} por ano
                {percentualEconomiaAnual ? ` — você economiza ${percentualEconomiaAnual}% em relação ao mensal` : ''}
              </p>
            </div>
          )}
          {precoMensal && (
            <p className="text-sm text-texto-suave">
              Prefere mês a mês? {precoMensal}/mês
              {precoMensalPorDia ? ` — menos de ${precoMensalPorDia} por dia` : ''}
            </p>
          )}
          <p className="text-xs text-texto-suave">
            Preço de referência para o Brasil — o valor final é confirmado no seu país ao criar a conta.
          </p>
        </div>
      )}

      <p className="resultado-bloco resultado-bloco-6 relative text-center text-xs text-texto-suave">
        Cancele quando quiser, sem multa. Sem risco.
      </p>

      <div className="resultado-bloco resultado-bloco-7 relative">
        <Botao type="button" onClick={() => router.push('/login')} className="resultado-cta">
          Quero começar minha transformação
        </Botao>
        <p className="mt-3 text-center text-sm text-texto-suave">
          Comece hoje. Sua versão mais leve está a 5 minutos de distância.
        </p>
      </div>
    </main>
  );
}
