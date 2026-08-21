'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registrarConsentimento, confirmarPais } from './actions';
import { sair } from '@/app/perfil/actions';
import Botao from '@/app/components/Botao';
import { PAISES_SUPORTADOS, NOME_PAIS, type PaisSuportado } from '@/lib/perfil/pais';

type Etapa = 'perguntando' | 'confirmada' | 'negada' | 'pais';

export default function OnboardingClient({
  consentimentoJaRegistrado,
  paisJaConfirmado,
}: {
  consentimentoJaRegistrado: boolean;
  paisJaConfirmado: boolean;
}) {
  // Se o consentimento já existe (conta que já passou pelo onboarding antes
  // de pais_confirmado_em existir), pula direto para a etapa de país — nunca
  // repete a pergunta de maioridade nem os termos para quem já aceitou.
  const [etapaMaioridade, setEtapaMaioridade] = useState<Etapa>(
    consentimentoJaRegistrado ? 'pais' : 'perguntando'
  );
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
      }
      // Em sucesso, a própria action redireciona para '/'.
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
