'use client';

import { useState, useTransition } from 'react';
import { revisarResgate } from './actions';
import type { StatusResgateRecompensa } from '@/lib/supabase/types';

const PROXIMOS_PASSOS: Record<string, Exclude<StatusResgateRecompensa, 'solicitado'>[]> = {
  solicitado: ['em_analise', 'aprovado', 'recusado', 'cancelado'],
  em_analise: ['aprovado', 'recusado', 'cancelado'],
  aprovado: ['entregue', 'cancelado'],
};

const ROTULOS: Record<string, string> = {
  em_analise: 'Marcar em análise',
  aprovado: 'Aprovar',
  entregue: 'Marcar como entregue',
  recusado: 'Recusar (estorna Pétalas)',
  cancelado: 'Cancelar (estorna Pétalas)',
};

export default function LinhaResgate({
  resgateId,
  statusAtual,
}: {
  resgateId: string;
  statusAtual: StatusResgateRecompensa;
}) {
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const opcoes = PROXIMOS_PASSOS[statusAtual] ?? [];

  function aplicar(novoStatus: Exclude<StatusResgateRecompensa, 'solicitado'>) {
    setErro(null);
    startTransition(async () => {
      const resultado = await revisarResgate(resgateId, novoStatus, observacao);
      if (!resultado.ok) {
        setErro(resultado.motivo);
      }
    });
  }

  if (opcoes.length === 0) {
    return <p className="text-xs text-texto-suave">Pedido em estado final — sem mais ações.</p>;
  }

  return (
    <div className="space-y-2">
      <textarea
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observação interna (opcional)"
        rows={2}
        className="w-full rounded-xl border border-borda bg-superficie p-2 text-sm text-texto"
      />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <div className="flex flex-wrap gap-2">
        {opcoes.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pendente}
            onClick={() => aplicar(status)}
            className="rounded-full border border-borda px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
          >
            {ROTULOS[status] ?? status}
          </button>
        ))}
      </div>
    </div>
  );
}
