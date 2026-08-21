'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import type { Sessao, Modulo } from '@/lib/jornadas-conteudo/tipos';
import BaseCientifica from './BaseCientifica';

export default function SessaoClient({
  sessao,
  modulo,
  jornadaSlug,
  jornadaTitulo,
  proximaSessaoHref,
  onConcluir,
}: {
  sessao: Sessao;
  modulo: Modulo;
  jornadaSlug: string;
  jornadaTitulo: string;
  proximaSessaoHref: string | null;
  onConcluir: () => Promise<void>;
}) {
  const router = useRouter();
  const [concluindo, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const destinoAoConcluir = proximaSessaoHref ?? `/jornadas/${jornadaSlug}`;

  function handleConcluir() {
    setErro(null);
    startTransition(async () => {
      try {
        await onConcluir();
        router.push(destinoAoConcluir);
      } catch {
        setErro('Não foi possível concluir a sessão agora. Tente novamente.');
      }
    });
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 px-4 pt-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/jornadas/${jornadaSlug}`}
          className="text-sm text-texto-suave hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
        >
          ← {jornadaTitulo}
        </Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
          {modulo.titulo} · {sessao.duracaoMinutos} min
        </p>
        <h1 className="font-display text-2xl text-texto">{sessao.titulo}</h1>
      </header>

      <section aria-labelledby="entenda-titulo" className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
        <h2 id="entenda-titulo" className="font-display text-sm text-texto">
          Entenda em 1 minuto
        </h2>
        <p className="text-sm leading-relaxed text-texto-suave">{sessao.entendaEm1Minuto}</p>
      </section>

      <section aria-labelledby="pratica-titulo" className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
        <h2 id="pratica-titulo" className="font-display text-sm text-texto">
          Prática guiada
        </h2>
        <ol className="space-y-3">
          {sessao.praticaGuiada.map((passo, indice) => (
            <li key={indice} className="flex gap-3 text-sm leading-relaxed text-texto-suave">
              <span className="shrink-0 font-medium text-texto">{indice + 1}.</span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      {sessao.reflexao && (
        <section aria-labelledby="reflexao-titulo" className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
          <h2 id="reflexao-titulo" className="font-display text-sm text-texto">
            Uma reflexão, se quiser
          </h2>
          <p className="text-sm leading-relaxed text-texto-suave">{sessao.reflexao}</p>
          <p className="text-xs text-texto-suave">
            Isso é só para você pensar — não precisa escrever nem responder em nenhum lugar.
          </p>
        </section>
      )}

      <section aria-labelledby="leve-titulo" className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
        <h2 id="leve-titulo" className="font-display text-sm text-texto">
          Leve com você
        </h2>
        <p className="text-sm leading-relaxed text-texto-suave">{sessao.leveComVoce}</p>
      </section>

      <BaseCientifica ids={sessao.fontesCientificas} />

      {sessao.avisoSeguranca && (
        <div
          role="status"
          className="flex gap-2 rounded-2xl border-2 border-alerta bg-alerta/10 p-4"
        >
          <span aria-hidden="true" className="shrink-0 text-lg">
            ⚠️
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-alerta">Aviso de segurança</p>
            <p className="text-sm leading-relaxed text-alerta">{sessao.avisoSeguranca}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Botao
          onClick={handleConcluir}
          disabled={concluindo}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
        >
          {concluindo ? 'Concluindo...' : 'Concluir sessão'}
        </Botao>
        <Link
          href={`/jornadas/${jornadaSlug}`}
          className="block w-full rounded-2xl p-3 text-center text-sm text-texto-suave hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2"
        >
          Sair
        </Link>
        {erro && (
          <p role="alert" className="text-sm text-alerta">
            {erro}
          </p>
        )}
      </div>
    </main>
  );
}
