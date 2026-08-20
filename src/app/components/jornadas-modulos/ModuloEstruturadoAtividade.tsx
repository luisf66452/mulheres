'use client';

import { useEffect, useRef, useState } from 'react';
import Botao from '@/app/components/Botao';
import Escala from '@/app/components/Escala';
import CampoExercicioInput from './CampoExercicioInput';
import CardAtencaoSeguranca from './CardAtencaoSeguranca';
import { escolherFeedback } from '@/lib/jornadas-modulos/avaliarFeedback';
import { detectarSinalDeAtencao } from '@/lib/jornadas-modulos/deteccaoAtencao';
import { SCHEMA_VERSION_MODULO_ATUAL } from '@/lib/jornadas-modulos/tipos';
import type { ModuloEstruturadoV1, RespostaModuloV1, ValorCampo } from '@/lib/jornadas-modulos/tipos';

type Etapa = 'antes' | 'aprender' | 'exercicio' | 'revisao' | 'depois';

function campoPreenchido(valor: ValorCampo | undefined): boolean {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'string') return valor.trim() !== '';
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
}

export default function ModuloEstruturadoAtividade({
  titulo,
  modulo,
  respostaInicial,
  aoFinalizar,
  salvarRascunho,
}: {
  titulo: string;
  modulo: ModuloEstruturadoV1;
  respostaInicial: RespostaModuloV1 | null;
  aoFinalizar: (sensacaoAntes: number, sensacaoDepois: number) => Promise<void>;
  salvarRascunho: (respostas: RespostaModuloV1) => Promise<{ ok: boolean }>;
}) {
  const [etapa, setEtapa] = useState<Etapa>('antes');
  const [sensacaoAntes, setSensacaoAntes] = useState<number | null>(null);
  const [sensacaoDepois, setSensacaoDepois] = useState<number | null>(null);
  const [valores, setValores] = useState<Record<string, ValorCampo>>(respostaInicial?.valores ?? {});
  const [enviando, setEnviando] = useState(false);
  const timeoutSalvar = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current);
    },
    []
  );

  function persistir(valoresParaSalvar: Record<string, ValorCampo>, finalizadoEm: string | null) {
    return salvarRascunho({
      schemaVersion: SCHEMA_VERSION_MODULO_ATUAL,
      valores: valoresParaSalvar,
      finalizadoEm,
    });
  }

  function atualizarCampo(campoId: string, valor: ValorCampo) {
    setValores((atual) => {
      const novo = { ...atual, [campoId]: valor };
      if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current);
      timeoutSalvar.current = setTimeout(() => {
        persistir(novo, null);
      }, 800);
      return novo;
    });
  }

  const camposObrigatoriosPreenchidos = modulo.exercicio.campos
    .filter((c) => !c.opcional)
    .every((c) => campoPreenchido(valores[c.id]));

  const algumSinalDeAtencao = modulo.camposParaTriagem.some((id) => {
    const v = valores[id];
    return typeof v === 'string' && detectarSinalDeAtencao(v);
  });

  if (etapa === 'antes') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <p className="text-texto">Antes de começar, como você está se sentindo agora?</p>
        <Escala valor={sensacaoAntes} onChange={setSensacaoAntes} />
        <Botao disabled={sensacaoAntes === null} onClick={() => setEtapa('aprender')}>
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'aprender') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
            {modulo.duracaoEstimadaMinutos} min · módulo
          </p>
          <h1 className="font-display text-2xl text-texto">{titulo}</h1>
          <p className="text-texto-suave">{modulo.objetivo}</p>
        </div>

        <div className="space-y-3">
          {modulo.explicacao.map((paragrafo, i) => (
            <p key={i} className="whitespace-pre-line text-texto">
              {paragrafo}
            </p>
          ))}
        </div>

        <div className="space-y-1 rounded-2xl border border-borda bg-superficie p-4">
          <h2 className="font-display text-lg text-texto">{modulo.exemplo.titulo}</h2>
          <p className="whitespace-pre-line text-texto-suave">{modulo.exemplo.texto}</p>
        </div>

        <Botao onClick={() => setEtapa('exercicio')}>Ir para o exercício</Botao>
      </main>
    );
  }

  if (etapa === 'exercicio') {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="font-display text-2xl text-texto">{titulo}</h1>
        <p className="text-texto-suave">{modulo.exercicio.introducao}</p>

        <div className="space-y-5">
          {modulo.exercicio.campos.map((campo) => (
            <CampoExercicioInput
              key={campo.id}
              campo={campo}
              valor={valores[campo.id]}
              onChange={(valor) => atualizarCampo(campo.id, valor)}
            />
          ))}
        </div>

        {modulo.camposParaTriagem.length > 0 && <CardAtencaoSeguranca destacado={algumSinalDeAtencao} />}

        <Botao
          disabled={!camposObrigatoriosPreenchidos}
          onClick={async () => {
            if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current);
            await persistir(valores, null);
            setEtapa('revisao');
          }}
        >
          Continuar
        </Botao>
      </main>
    );
  }

  if (etapa === 'revisao') {
    const feedback = escolherFeedback(modulo, valores);
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <div className="space-y-2 rounded-2xl border border-acao/30 bg-acao/5 p-4">
          <h2 className="font-display text-lg text-texto">O que percebemos</h2>
          <p className="text-texto">{feedback}</p>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg text-texto">Uma ação pequena para hoje</h2>
          <p className="text-texto">{modulo.acaoPratica}</p>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg text-texto">Resumo</h2>
          <ul className="list-disc space-y-1 pl-5 text-texto">
            {modulo.resumo.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {modulo.avisoSeguranca && (
          <div className="space-y-1 rounded-2xl border border-alerta bg-alerta/10 p-4 text-sm">
            <p className="text-texto">{modulo.avisoSeguranca}</p>
            <a href="/seguranca" className="inline-block font-medium text-acao underline underline-offset-2">
              Ver recursos de apoio
            </a>
          </div>
        )}

        <details className="space-y-2 text-sm">
          <summary className="cursor-pointer font-medium text-texto">Base científica</summary>
          <div className="space-y-3 pt-2">
            {modulo.baseCientifica.map((ref, i) => (
              <div key={i} className="space-y-1 border-l-2 border-borda pl-3">
                <p className="text-texto">{ref.afirmacao}</p>
                <p className="text-texto-suave">
                  {ref.referencia} —{' '}
                  <a href={ref.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    fonte
                  </a>
                </p>
                <p className="text-texto-suave">Limitações: {ref.limitacoes}</p>
              </div>
            ))}
            <p className="text-texto-suave">
              Conteúdo psicoeducativo de apoio — não substitui avaliação, diagnóstico ou acompanhamento
              profissional. Este material aguarda validação da psicóloga responsável pelo Rose.
            </p>
          </div>
        </details>

        <Botao onClick={() => setEtapa('depois')}>Continuar</Botao>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <p className="text-texto">Como você se sente agora?</p>
      <Escala valor={sensacaoDepois} onChange={setSensacaoDepois} />
      <Botao
        disabled={sensacaoDepois === null || enviando}
        onClick={async () => {
          setEnviando(true);
          await persistir(valores, new Date().toISOString());
          await aoFinalizar(sensacaoAntes!, sensacaoDepois!);
        }}
      >
        Finalizar
      </Botao>
    </main>
  );
}
