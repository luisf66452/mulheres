'use client';

import { useState } from 'react';
import { registrarIntencaoPagamento } from './actions';

const OPCOES = [
  { id: 'mensal', label: 'Mensal', preco: 19.9 },
  { id: 'anual', label: 'Anual', preco: 149.9 },
  { id: 'nenhum', label: 'Não pagaria por isso agora', preco: 0 },
];

export default function PremiumPage() {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleEscolher(id: string, preco: number) {
    setEscolhido(id);
    await registrarIntencaoPagamento(id, preco);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <p className="text-texto">Obrigada! Isso nos ajuda a construir a versão completa do app.</p>
        <a
          href="/checkin"
          className="block w-full rounded-2xl border border-borda p-3 text-center text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Versão Premium</h1>
      <p className="text-texto">
        Histórico completo, insights semanais, biblioteca completa de práticas e jornadas guiadas.
        Ainda não cobramos por isso — queremos entender se faria sentido para você.
      </p>
      <div className="space-y-3">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.id}
            onClick={() => handleEscolher(opcao.id, opcao.preco)}
            className={`w-full rounded-2xl border p-3 text-left text-texto transition-colors ${
              escolhido === opcao.id ? 'border-acao bg-superficie' : 'border-borda'
            }`}
          >
            {opcao.label} {opcao.preco > 0 && `— R$ ${opcao.preco.toFixed(2)}`}
          </button>
        ))}
      </div>
    </main>
  );
}
