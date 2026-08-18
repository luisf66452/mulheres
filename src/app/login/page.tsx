'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { enviarLinkMagico } from './actions';
import Botao from '@/app/components/Botao';
import IlustracaoBotanica from './IlustracaoBotanica';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [confirmouMaioridade, setConfirmouMaioridade] = useState(false);
  const [enviado, setEnviado] = useState(false);
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

  if (enviado) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fundo p-6">
        <IlustracaoBotanica />
        <p className="text-center text-lg text-texto">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail para entrar.
        </p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fundo p-6">
      <IlustracaoBotanica />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl text-texto">Entrar</h1>
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
          Receber link de acesso
        </Botao>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
