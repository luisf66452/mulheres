'use client';

import { useState, useTransition } from 'react';
import { registrarConsentimento } from './actions';
import { sair } from '@/app/perfil/actions';
import Botao from '@/app/components/Botao';

type EtapaMaioridade = 'perguntando' | 'confirmada' | 'negada';

export default function OnboardingPage() {
  // Pergunta de maioridade primeiro, antes de qualquer coleta de dado —
  // mesmo que o login já peça essa confirmação (contas criadas antes dessa
  // checagem existir, ou que chegaram por outro caminho, ainda passam por
  // aqui). Se a resposta for "não", nada além dessa resposta é registrado:
  // sem nome, sem dados sensíveis, sem continuar para o resto do app.
  const [etapaMaioridade, setEtapaMaioridade] = useState<EtapaMaioridade>('perguntando');
  const [saindo, startSaida] = useTransition();

  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    });
  }

  if (etapaMaioridade === 'negada') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl text-texto">O Rose é para pessoas adultas</h1>
        <p className="text-texto-suave">
          Este app é destinado exclusivamente a maiores de 18 anos e não foi desenhado para o
          acompanhamento de menores de idade. Não vamos pedir nem guardar mais nenhuma informação sua.
        </p>
        <Botao
          type="button"
          variante="secundaria"
          disabled={saindo}
          onClick={() => startSaida(() => sair())}
        >
          {saindo ? 'Saindo…' : 'Sair'}
        </Botao>
      </main>
    );
  }

  if (etapaMaioridade === 'perguntando') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="font-display text-2xl text-texto">Antes de começar</h1>
        <p className="text-texto">
          O Rose é destinado exclusivamente a pessoas adultas. Você tem 18 anos ou mais?
        </p>
        <div className="flex w-full gap-3">
          <Botao type="button" variante="secundaria" onClick={() => setEtapaMaioridade('negada')} className="flex-1">
            Não
          </Botao>
          <Botao type="button" onClick={() => setEtapaMaioridade('confirmada')} className="flex-1">
            Sim, tenho 18+
          </Botao>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Antes de começar</h1>
      <p className="text-texto">
        Este app não é terapia, não faz diagnóstico e não substitui acompanhamento profissional.
        Ele te ajuda a construir um pequeno ritual diário de cuidado com você mesma.
      </p>

      <label className="block text-texto">
        Como podemos te chamar? (opcional)
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>

      <label className="flex items-start gap-3 text-texto">
        <input
          type="checkbox"
          checked={aceitouTermos}
          onChange={(e) => setAceitouTermos(e.target.checked)}
          className="mt-1"
        />
        <span>
          Li e aceito os <a href="/privacidade" className="underline">Termos de Uso e a Política de Privacidade</a>.
        </span>
      </label>

      <label className="flex items-start gap-3 text-texto">
        <input
          type="checkbox"
          checked={aceitouDadosSensiveis}
          onChange={(e) => setAceitouDadosSensiveis(e.target.checked)}
          className="mt-1"
        />
        <span>
          Entendo que este app coleta dados sensíveis sobre humor, imagem corporal e alimentação,
          e autorizo esse tratamento para receber o ritual diário personalizado.
        </span>
      </label>

      {erro && <p className="text-alerta">{erro}</p>}

      <Botao disabled={!podeContinuar || enviando} onClick={handleContinuar}>
        {enviando ? 'Enviando...' : 'Continuar'}
      </Botao>
    </main>
  );
}
