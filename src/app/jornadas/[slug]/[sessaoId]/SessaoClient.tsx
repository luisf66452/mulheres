'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Botao from '@/app/components/Botao';
import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';
import type { Sessao } from '@/lib/jornadas-conteudo/tipos';
import BaseCientifica from './BaseCientifica';
import { concluirSessaoJornadaConteudo } from './actions';

type Etapa = 'entenda' | 'pratica' | 'reflexao' | 'fechamento';

const ROTULO_TIPO: Record<Sessao['tipo'], string> = {
  reflexao: 'Reflexão',
  escrita: 'Escrita',
  exercicio: 'Exercício',
  plano: 'Plano de ação',
};

export default function SessaoClient({
  jornadaSlug,
  jornadaTitulo,
  sessao,
}: {
  jornadaSlug: string;
  jornadaTitulo: string;
  sessao: Sessao;
}) {
  const [etapa, setEtapa] = useState<Etapa>('entenda');
  const [passoPratica, setPassoPratica] = useState(0);
  const [concluindo, startTransition] = useTransition();

  const totalPassos = sessao.praticaGuiada.length;
  const ultimoPasso = passoPratica === totalPassos - 1;

  function avancarPratica() {
    if (ultimoPasso) {
      setEtapa(sessao.reflexao ? 'reflexao' : 'fechamento');
    } else {
      setPassoPratica((p) => p + 1);
    }
  }

  function voltarPratica() {
    if (passoPratica === 0) {
      setEtapa('entenda');
    } else {
      setPassoPratica((p) => p - 1);
    }
  }

  function handleConcluir() {
    startTransition(() => {
      void concluirSessaoJornadaConteudo(jornadaSlug, sessao.id);
    });
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden px-4 pt-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <RosaBotanica
        tamanho="pequena"
        comCaule={false}
        className="pointer-events-none absolute -right-2 top-2 opacity-[0.07]"
      />

      <div className="relative flex items-center justify-between">
        <Link
          href={`/jornadas/${jornadaSlug}`}
          className="text-sm text-texto-suave hover:text-texto"
        >
          ← {jornadaTitulo}
        </Link>
        <span className="text-xs text-texto-suave">Você pode sair a qualquer momento — nada se perde.</span>
      </div>

      <div className="relative space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
          {ROTULO_TIPO[sessao.tipo]} · {sessao.duracaoMinutos} min
        </p>
        <h1 className="font-display text-2xl text-texto">{sessao.titulo}</h1>
      </div>

      {etapa === 'entenda' && (
        <section className="relative space-y-4">
          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="font-display text-sm text-texto">Entenda em 1 minuto</p>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{sessao.entendaEm1Minuto}</p>
          </div>
          {sessao.avisoSeguranca && (
            <div className="rounded-2xl border border-alerta/40 bg-superficie p-4">
              <p className="text-sm leading-relaxed text-alerta">{sessao.avisoSeguranca}</p>
            </div>
          )}
          <Botao onClick={() => setEtapa('pratica')}>Começar prática</Botao>
        </section>
      )}

      {etapa === 'pratica' && (
        <section className="relative space-y-4">
          <p className="text-xs text-texto-suave">
            Passo {passoPratica + 1} de {totalPassos}
          </p>
          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="text-base leading-relaxed text-texto">{sessao.praticaGuiada[passoPratica]}</p>
          </div>
          <div className="flex gap-3">
            <Botao variante="secundaria" onClick={voltarPratica} className="flex-1">
              Voltar
            </Botao>
            <Botao onClick={avancarPratica} className="flex-1">
              {ultimoPasso ? 'Continuar' : 'Próximo passo'}
            </Botao>
          </div>
        </section>
      )}

      {etapa === 'reflexao' && sessao.reflexao && (
        <section className="relative space-y-4">
          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="font-display text-sm text-texto">Uma reflexão, se quiser</p>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{sessao.reflexao}</p>
            <p className="mt-2 text-xs text-texto-suave">
              Isso é só para você pensar — não precisa escrever nem responder em nenhum lugar.
            </p>
          </div>
          <Botao onClick={() => setEtapa('fechamento')}>Continuar</Botao>
        </section>
      )}

      {etapa === 'fechamento' && (
        <section className="relative space-y-4">
          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="font-display text-sm text-texto">Leve com você</p>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{sessao.leveComVoce}</p>
          </div>
          <BaseCientifica ids={sessao.fontesCientificas} />
          <Botao onClick={handleConcluir} disabled={concluindo}>
            {concluindo ? 'Concluindo...' : 'Concluir sessão'}
          </Botao>
        </section>
      )}
    </main>
  );
}
