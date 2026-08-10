'use client';

import { useState } from 'react';
import { enviarLinkMagico } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-center text-lg">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail para entrar.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-3"
        />
        {erro && <p className="text-red-600">{erro}</p>}
        <button type="submit" className="w-full rounded bg-black p-3 text-white">
          Receber link de acesso
        </button>
      </form>
    </main>
  );
}
