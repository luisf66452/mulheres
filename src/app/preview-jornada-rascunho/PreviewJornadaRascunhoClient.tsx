'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ativarJornadaRascunhoPreview,
  liberarProximoDiaQA,
  voltarDiaAnteriorQA,
  reiniciarProgressoQA,
} from './actions';
import Botao from '@/app/components/Botao';

const DURACAO_DIAS = 9;

export default function PreviewJornadaRascunhoClient({
  inscrita,
  diasCompletados,
  statusInscricao,
}: {
  inscrita: boolean;
  diasCompletados: number;
  statusInscricao: string | null;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [processando, startTransition] = useTransition();

  function rodar(acao: () => Promise<{ erro?: string; pausouOutraJornada?: boolean }>) {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const resultado = await acao();
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (resultado?.pausouOutraJornada) {
        setAviso('Outra jornada que estava ativa na sua conta foi pausada (não apagada) para liberar a de teste.');
      }
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div
        role="status"
        className="space-y-1 rounded-2xl border-2 border-alerta bg-alerta/10 p-4"
      >
        <p className="font-display text-lg text-texto">🧪 Modo de teste (Preview) — Somente teste</p>
        <p className="text-texto-suave">
          Esta página e os controles abaixo só existem neste deployment de Preview. Eles operam
          exclusivamente na sua própria conta e na jornada &ldquo;Fundamentos emocionais&rdquo; (9
          módulos), que continua em rascunho — usuárias reais não veem nada disto.
        </p>
      </div>

      {!inscrita ? (
        <div className="space-y-3">
          <p className="text-texto">
            Você ainda não está inscrita na jornada de teste.
          </p>
          <Botao disabled={processando} onClick={() => rodar(ativarJornadaRascunhoPreview)}>
            {processando ? 'Ativando...' : 'Ativar jornada de rascunho (somente teste)'}
          </Botao>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="text-texto">
              Progresso de teste: <strong>{diasCompletados}</strong> de {DURACAO_DIAS} dias concluídos
              {statusInscricao === 'concluida' ? ' — jornada de teste concluída' : ''}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Botao
              variante="secundaria"
              disabled={processando || diasCompletados <= 0}
              onClick={() => rodar(voltarDiaAnteriorQA)}
            >
              ← Voltar um dia (teste)
            </Botao>
            <Botao
              disabled={processando || diasCompletados >= DURACAO_DIAS}
              onClick={() => rodar(liberarProximoDiaQA)}
            >
              Liberar próximo dia (teste) →
            </Botao>
          </div>

          <Botao variante="secundaria" disabled={processando} onClick={() => rodar(reiniciarProgressoQA)}>
            {processando ? 'Reiniciando...' : 'Reiniciar progresso desta jornada de teste'}
          </Botao>

          <p className="text-sm text-texto-suave">
            Reiniciar não apaga pétalas nem sessões já concluídas — por isso, se você refizer um dia
            já concluído e clicar em &ldquo;Finalizar&rdquo; de novo dentro do módulo, o sistema não
            concede pétalas duplicadas (a mesma verificação de produção continua valendo aqui).
          </p>

          <a
            href="/checkin"
            className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
          >
            Ir para o check-in de hoje →
          </a>
        </div>
      )}

      {aviso && <p className="text-texto-suave">{aviso}</p>}
      {erro && <p role="alert" className="text-alerta">{erro}</p>}
    </main>
  );
}
