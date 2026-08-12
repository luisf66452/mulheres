'use client';

import { useState, useTransition } from 'react';
import { atualizarNome } from './actions';
import Botao from '@/app/components/Botao';

export default function EditarNomeForm({ nomeAtual }: { nomeAtual: string | null }) {
  const [nome, setNome] = useState(nomeAtual ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function handleSalvar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarNome(nome);
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-texto">
        Nome
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <Botao disabled={enviando} onClick={handleSalvar}>
        {enviando ? 'Salvando...' : 'Salvar nome'}
      </Botao>
    </div>
  );
}
