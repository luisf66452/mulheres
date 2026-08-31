'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  registrarConsentimento,
  confirmarPais,
  salvarObjetivos,
  salvarTemasSensiveis,
  concluirPersonalizacao,
} from './actions';
import { sair } from '@/app/perfil/actions';
import { lerRespostasQuiz, apagarRespostasQuiz } from '@/lib/quiz/armazenamento';
import Botao from '@/app/components/Botao';
import SeletorObjetivos from '@/app/components/personalizacao/SeletorObjetivos';
import SeletorTemasSensiveis from '@/app/components/personalizacao/SeletorTemasSensiveis';
import SeletorLembrete from '@/app/components/personalizacao/SeletorLembrete';
import { PAISES_SUPORTADOS, NOME_PAIS, type PaisSuportado } from '@/lib/perfil/pais';

type Etapa = 'perguntando' | 'confirmada' | 'negada' | 'pais' | 'objetivos' | 'temas' | 'lembrete';

export default function OnboardingClient({
  consentimentoJaRegistrado,
  paisJaConfirmado,
  personalizacaoJaConcluida,
}: {
  consentimentoJaRegistrado: boolean;
  paisJaConfirmado: boolean;
  personalizacaoJaConcluida: boolean;
}) {
  // Se o consentimento já existe (conta que já passou pelo onboarding antes
  // de pais_confirmado_em existir), pula direto para a etapa de país — nunca
  // repete a pergunta de maioridade nem os termos para quem já aceitou. E se
  // o país também já foi confirmado mas a personalização (objetivos/temas/
  // lembrete) ainda não foi concluída — ex.: a usuária fechou o app no meio
  // do wizard —, retoma direto na etapa de objetivos em vez de mandar pra
  // pais de novo. Quem já concluiu tudo nunca chega a montar este componente
  // (ver o redirect em page.tsx).
  const [etapaMaioridade, setEtapaMaioridade] = useState<Etapa>(() => {
    if (!consentimentoJaRegistrado) return 'perguntando';
    if (!paisJaConfirmado) return 'pais';
    return 'objetivos';
  });
  const [saindo, startSaida] = useTransition();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouDadosSensiveis, setAceitouDadosSensiveis] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const [paisEscolhido, setPaisEscolhido] = useState<PaisSuportado | null>(null);
  const [erroPais, setErroPais] = useState<string | null>(null);
  const [confirmandoPais, startConfirmacaoPais] = useTransition();

  // Ponte do quiz pré-cadastro (/comecar) — ver spec 2026-08-31. Só age
  // quando existem respostas salvas no localStorage; caso contrário,
  // aplicandoRespostasQuiz nunca sai de `false` e a etapa 'objetivos'
  // renderiza exatamente como antes (fallback seguro, ver Global
  // Constraints do plano).
  const [aplicandoRespostasQuiz, setAplicandoRespostasQuiz] = useState(false);

  useEffect(() => {
    if (etapaMaioridade !== 'objetivos') return;
    const respostas = lerRespostasQuiz();
    if (!respostas) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAplicandoRespostasQuiz(true);
    let cancelado = false;

    (async () => {
      try {
        const resultadoObjetivos = await salvarObjetivos([respostas.objetivo]);
        if (cancelado) return;
        if (resultadoObjetivos.erro) {
          setAplicandoRespostasQuiz(false);
          return;
        }
        const resultadoTemas = await salvarTemasSensiveis(respostas.temasSensiveis);
        if (cancelado) return;
        if (resultadoTemas.erro) {
          setAplicandoRespostasQuiz(false);
          return;
        }
        apagarRespostasQuiz();
        setEtapaMaioridade('lembrete');
      } catch {
        // salvarObjetivos/salvarTemasSensiveis rejeitou (falha de rede/servidor)
        // em vez de resolver com { erro } — sem este catch a usuária ficava
        // presa para sempre em "Preparando seu plano...", já que /onboarding
        // é um gate obrigatório do middleware. Cai no fluxo manual, sem apagar
        // o quiz (mesma lógica dos ramos { erro } acima).
        if (!cancelado) setAplicandoRespostasQuiz(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [etapaMaioridade]);

  const podeContinuar = aceitouTermos && aceitouDadosSensiveis;

  function handleContinuar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await registrarConsentimento(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (paisJaConfirmado) {
        router.push('/');
      } else {
        setEtapaMaioridade('pais');
      }
    });
  }

  function handleConfirmarPais() {
    if (!paisEscolhido) return;
    setErroPais(null);
    startConfirmacaoPais(async () => {
      const resultado = await confirmarPais(paisEscolhido);
      if (resultado?.erro) {
        setErroPais(resultado.erro);
        return;
      }
      // País deixou de ser a última etapa: quem já concluiu a personalização
      // antes (edge case de revisitar /onboarding manualmente) vai direto
      // para a home; quem não concluiu segue para objetivos → temas →
      // lembrete.
      if (personalizacaoJaConcluida) {
        router.push('/');
      } else {
        setEtapaMaioridade('objetivos');
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

  if (etapaMaioridade === 'pais') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">De qual país você está acessando?</h1>
          <p className="text-texto-suave">
            Usamos isso só para te mostrar os contatos de apoio corretos (como linhas de emergência)
            caso você precise. Você pode confirmar essa escolha nas configurações depois, mas ela não
            vai ser perguntada de novo automaticamente.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PAISES_SUPORTADOS.map((pais) => (
            <button
              key={pais}
              type="button"
              onClick={() => setPaisEscolhido(pais)}
              aria-pressed={paisEscolhido === pais}
              className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
                paisEscolhido === pais
                  ? 'border-acao bg-acao/10 text-texto'
                  : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {NOME_PAIS[pais]}
            </button>
          ))}
        </div>

        {erroPais && <p className="text-alerta">{erroPais}</p>}

        <Botao disabled={!paisEscolhido || confirmandoPais} onClick={handleConfirmarPais}>
          {confirmandoPais ? 'Confirmando...' : 'Confirmar'}
        </Botao>
      </main>
    );
  }

  if (etapaMaioridade === 'objetivos') {
    if (aplicandoRespostasQuiz) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-texto-suave">Preparando seu plano...</p>
        </main>
      );
    }
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">O que você quer priorizar agora?</h1>
          <p className="text-texto-suave">
            Escolha quantos fizerem sentido — isso ajuda a personalizar seu ritual diário. Você pode
            mudar de ideia quando quiser em Perfil.
          </p>
        </div>
        <SeletorObjetivos
          selecaoInicial={[]}
          onSalvar={salvarObjetivos}
          aoSalvarComSucesso={() => setEtapaMaioridade('temas')}
        />
      </main>
    );
  }

  if (etapaMaioridade === 'temas') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">Algum desses temas é sensível para você?</h1>
          <p className="text-texto-suave">
            Isso nos ajuda a ter mais cuidado com a linguagem que usamos com você. Também pode ser
            mudado depois.
          </p>
        </div>
        <SeletorTemasSensiveis
          selecaoInicial={[]}
          onSalvar={salvarTemasSensiveis}
          aoSalvarComSucesso={() => setEtapaMaioridade('lembrete')}
        />
      </main>
    );
  }

  if (etapaMaioridade === 'lembrete') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl text-texto">Quer um lembrete diário?</h1>
          <p className="text-texto-suave">
            Escolha um horário confortável para o seu ritual. Nada é enviado automaticamente — isso só
            define sua preferência.
          </p>
        </div>
        <SeletorLembrete horarioInicial={null} onSalvar={concluirPersonalizacao} rotuloBotao="Concluir" />
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
