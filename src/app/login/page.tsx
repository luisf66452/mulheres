'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { enviarLinkMagico } from './actions';
import Botao from '@/app/components/Botao';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(searchParams.get('erro'));

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
      <main className="flex min-h-screen items-center justify-center bg-fundo p-6">
        <p className="text-center text-lg text-texto">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail para entrar.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl text-texto">Entrar</h1>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
        {erro && <p className="text-alerta">{erro}</p>}
        <Botao type="submit">Receber link de acesso</Botao>
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
