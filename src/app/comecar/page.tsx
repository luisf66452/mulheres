'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/Botao';
import IlustracaoBotanica from '@/app/components/decoracao/IlustracaoBotanica';
import RosasDecorativas from '@/app/components/decoracao/RosasDecorativas';
import {
  OBJETIVOS,
  TEMAS_SENSIVEIS,
  TEMA_SENSIVEL_EXCLUSIVOS,
  type ObjetivoId,
  type TemaSensivelId,
} from '@/lib/perfil/personalizacao';
import {
  IDENTIFICACAO_OPCOES,
  FREQUENCIA_EMOCIONAL_OPCOES,
  TEMPO_DISPONIVEL_OPCOES,
  type IdentificacaoId,
  type FrequenciaEmocionalId,
  type TempoDisponivelId,
} from '@/lib/quiz/tipos';
import { salvarRespostasQuiz } from '@/lib/quiz/armazenamento';

type EtapaQuiz = 'identificacao' | 'frequencia' | 'objetivo' | 'temas' | 'tempo';

const BOTAO_OPCAO =
  'rounded-2xl border border-borda bg-superficie p-4 text-left font-medium text-texto-suave transition-colors hover:border-acao';

export default function ComecarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<EtapaQuiz>('identificacao');
  const [identificacao, setIdentificacao] = useState<IdentificacaoId | null>(null);
  const [frequenciaEmocional, setFrequenciaEmocional] = useState<FrequenciaEmocionalId | null>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoId | null>(null);
  const [temasSensiveis, setTemasSensiveis] = useState<TemaSensivelId[]>([]);

  function alternarTema(id: TemaSensivelId) {
    if (TEMA_SENSIVEL_EXCLUSIVOS.includes(id)) {
      setTemasSensiveis((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setTemasSensiveis((atual) => {
      const semExclusivos = atual.filter((item) => !TEMA_SENSIVEL_EXCLUSIVOS.includes(item));
      return semExclusivos.includes(id) ? semExclusivos.filter((item) => item !== id) : [...semExclusivos, id];
    });
  }

  function finalizar(tempoDisponivel: TempoDisponivelId) {
    if (!identificacao || !frequenciaEmocional || !objetivo) return;
    salvarRespostasQuiz({ identificacao, frequenciaEmocional, objetivo, temasSensiveis, tempoDisponivel });
    router.push('/comecar/resultado');
  }

  if (etapa === 'identificacao') {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
        <h1 className="relative text-center font-display text-2xl text-texto">
          Qual dessas frases mais parece com você hoje?
        </h1>
        <div className="relative flex flex-col gap-3">
          {IDENTIFICACAO_OPCOES.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setIdentificacao(opcao.id);
                setEtapa('frequencia');
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'frequencia') {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
        <h1 className="relative text-center font-display text-2xl text-texto">
          Com que frequência você se sente insatisfeita com sua imagem corporal?
        </h1>
        <div className="relative flex flex-col gap-3">
          {FREQUENCIA_EMOCIONAL_OPCOES.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setFrequenciaEmocional(opcao.id);
                setEtapa('objetivo');
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'objetivo') {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
        <h1 className="relative text-center font-display text-2xl text-texto">O que você quer priorizar agora?</h1>
        <div className="relative flex flex-col gap-3">
          {OBJETIVOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={BOTAO_OPCAO}
              onClick={() => {
                setObjetivo(item.id);
                setEtapa('temas');
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (etapa === 'temas') {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
        <IlustracaoBotanica tamanho="compacto" />
        <RosasDecorativas tamanho="compacto" />
        <h1 className="relative text-center font-display text-2xl text-texto">Algum desses temas é sensível para você?</h1>
        <div className="relative flex flex-col gap-3">
          {TEMAS_SENSIVEIS.filter((tema) => tema.id !== 'prefiro_nao_responder').map((tema) => (
            <button
              key={tema.id}
              type="button"
              onClick={() => alternarTema(tema.id)}
              aria-pressed={temasSensiveis.includes(tema.id)}
              className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
                temasSensiveis.includes(tema.id)
                  ? 'border-acao bg-acao/10 text-texto'
                  : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {tema.rotulo}
            </button>
          ))}
        </div>
        <Botao type="button" onClick={() => setEtapa('tempo')}>
          Continuar
        </Botao>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 overflow-hidden p-6">
      <IlustracaoBotanica tamanho="compacto" />
      <RosasDecorativas tamanho="compacto" />
      <h1 className="relative text-center font-display text-2xl text-texto">
        Quanto tempo você consegue reservar por dia pra se cuidar?
      </h1>
      <div className="relative flex flex-col gap-3">
        {TEMPO_DISPONIVEL_OPCOES.map((opcao) => (
          <button key={opcao.id} type="button" className={BOTAO_OPCAO} onClick={() => finalizar(opcao.id)}>
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </main>
  );
}
