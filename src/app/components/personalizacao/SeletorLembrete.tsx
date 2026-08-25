'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';

export default function SeletorLembrete({
  horarioInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Concluir',
}: {
  horarioInicial: string | null;
  onSalvar: (horario: string | null) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [horario, setHorario] = useState(horarioInicial ?? '09:00');
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function confirmar(valor: string | null) {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await onSalvar(valor);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      if (aoSalvarComSucesso) {
        aoSalvarComSucesso();
      } else {
        setSalvo(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block text-texto">
        Horário preferido para lembretes
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>

      {erro && <p className="text-alerta">{erro}</p>}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Salvo.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Botao disabled={salvando} onClick={() => confirmar(horario)}>
          {salvando ? 'Salvando...' : rotuloBotao}
        </Botao>
        <Botao variante="secundaria" disabled={salvando} onClick={() => confirmar(null)}>
          Não quero lembretes agora
        </Botao>
      </div>
    </div>
  );
}
