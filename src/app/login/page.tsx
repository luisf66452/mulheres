'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmarCodigoAcesso, enviarLinkMagico } from './actions';
import Botao from '@/app/components/Botao';
import IlustracaoBotanica from './IlustracaoBotanica';
import RosasDecorativas from './RosasDecorativas';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [confirmouMaioridade, setConfirmouMaioridade] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(searchParams.get('erro'));
  const contaExcluida = searchParams.get('conta_excluida') === '1';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const resultado = await enviarLinkMagico(email);
    if (resultado.erro) {
      setErro(resultado.erro);
    } else {
      setEnviado(true);
    }
  }

  async function handleConfirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setConfirmando(true);
    const resultado = await confirmarCodigoAcesso(email, codigo);
    if (resultado.erro) {
      setErro(resultado.erro);
      setConfirmando(false);
      return;
    }
    // Navegação completa (não router.push) para garantir que o middleware
    // já enxergue a sessão recém-criada pelo cookie definido na server action.
    window.location.href = '/?entrada=1';
  }

  if (enviado) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fundo p-6">
        <IlustracaoBotanica />
        <div className="relative w-full max-w-sm space-y-4 text-center">
          <p className="text-lg text-texto">
            Enviamos um código de acesso para <strong>{email}</strong>.
          </p>
          <p className="text-sm text-texto-suave">
            Abra seu e-mail e digite abaixo o código de 6 dígitos (não precisa clicar em nenhum link).
          </p>
          <form onSubmit={handleConfirmarCodigo} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full rounded-2xl border border-borda bg-superficie p-3 text-center text-2xl tracking-[0.4em] text-texto"
            />
            {erro && <p className="text-alerta">{erro}</p>}
            <Botao type="submit" disabled={confirmando}>
              {confirmando ? 'Confirmando...' : 'Entrar'}
            </Botao>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fundo p-6">
      <IlustracaoBotanica />
      <RosasDecorativas />
      <div className="relative w-full max-w-sm space-y-8">
        <ApresentacaoRose />
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-display text-xl text-texto">Comece agora</h2>
          {contaExcluida && (
            <p role="status" className="text-sm text-texto-suave">
              Sua conta foi excluída com sucesso. Esperamos te ver por aqui de novo algum dia.
            </p>
          )}
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          />
          <label className="flex items-start gap-3 text-left text-sm text-texto">
            <input
              type="checkbox"
              checked={confirmouMaioridade}
              onChange={(e) => setConfirmouMaioridade(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Confirmo que tenho 18 anos ou mais. O Rose é destinado exclusivamente a pessoas adultas.
            </span>
          </label>
          {erro && <p className="text-alerta">{erro}</p>}
          <Botao type="submit" disabled={!confirmouMaioridade}>
            Receber código de acesso
          </Botao>
        </form>
      </div>
    </main>
  );
}

// Contexto exibido acima do formulário — sem isso, quem chega pelo anúncio cai
// direto numa tela pedindo e-mail sem entender o que é a Rose (fonte do
// abandono na etapa de cadastro, visto no funil do pixel).
function ApresentacaoRose() {
  return (
    <div className="space-y-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acao">Rose</p>
      <h1 className="font-display text-3xl leading-tight text-texto">
        5 minutos por dia pra cuidar de você
      </h1>
      <p className="text-texto-suave">
        Sem dieta, sem culpa, sem comparação — só progresso, 1% de cada vez.
      </p>
      <ul className="space-y-1.5 pt-2 text-left text-sm text-texto">
        <li>• Um ritual diário de autoestima e imagem corporal</li>
        <li>• Check-ins guiados pra entender como você está se sentindo</li>
        <li>• Práticas curtas, feitas pra caber na sua rotina</li>
      </ul>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
