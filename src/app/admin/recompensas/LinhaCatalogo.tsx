'use client';

import { useState, useTransition } from 'react';
import { atualizarStatusRecompensa, atualizarEstoqueRecompensa } from './actions';
import type { StatusRecompensaCatalogo } from '@/lib/supabase/types';

export default function LinhaCatalogo({
  chave,
  nome,
  custo,
  status,
  estoque,
  temValorFinanceiro,
}: {
  chave: string;
  nome: string;
  custo: number;
  status: StatusRecompensaCatalogo;
  estoque: number | null;
  temValorFinanceiro: boolean;
}) {
  const [estoqueTexto, setEstoqueTexto] = useState(estoque === null ? '' : String(estoque));
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function alternarStatus() {
    setErro(null);
    const proximo: StatusRecompensaCatalogo = status === 'ativa' ? 'pausada' : 'ativa';
    startTransition(async () => {
      const resultado = await atualizarStatusRecompensa(chave, proximo);
      if (!resultado.ok) setErro(resultado.erro ?? 'Erro ao atualizar.');
    });
  }

  function salvarEstoque() {
    setErro(null);
    const valor = estoqueTexto.trim() === '' ? null : Number.parseInt(estoqueTexto, 10);
    startTransition(async () => {
      const resultado = await atualizarEstoqueRecompensa(chave, valor);
      if (!resultado.ok) setErro(resultado.erro ?? 'Erro ao atualizar.');
    });
  }

  return (
    <li className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-base text-texto">
            {nome} {temValorFinanceiro && <span className="text-xs text-alerta">(valor financeiro)</span>}
          </p>
          <p className="text-sm text-texto-suave">{custo.toLocaleString('pt-BR')} Pétalas</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === 'ativa' ? 'bg-lilas-claro text-acao' : 'bg-borda/50 text-texto-suave'
          }`}
        >
          {status === 'ativa' ? 'Ativa' : status === 'pausada' ? 'Pausada' : 'Futura'}
        </span>
      </div>

      {erro && <p className="text-sm text-alerta">{erro}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {status !== 'futura' && (
          <button
            type="button"
            disabled={pendente}
            onClick={alternarStatus}
            className="rounded-full border border-borda px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
          >
            {status === 'ativa' ? 'Pausar' : 'Reativar'}
          </button>
        )}
        <label className="flex items-center gap-2 text-xs text-texto-suave">
          Estoque (vazio = ilimitado)
          <input
            type="number"
            min={0}
            value={estoqueTexto}
            onChange={(e) => setEstoqueTexto(e.target.value)}
            className="w-20 rounded-lg border border-borda bg-fundo p-1 text-texto"
          />
        </label>
        <button
          type="button"
          disabled={pendente}
          onClick={salvarEstoque}
          className="rounded-full border border-borda px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:bg-fundo disabled:opacity-40"
        >
          Salvar estoque
        </button>
      </div>
    </li>
  );
}
