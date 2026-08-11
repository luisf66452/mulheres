'use client';

import { useState } from 'react';
import { inscreverPush } from '@/lib/push/subscribe';
import { salvarHorarioPreferido } from './actions';
import Botao from '@/app/components/Botao';

export default function SettingsPage() {
  const [horario, setHorario] = useState('09:00');
  const [status, setStatus] = useState<string | null>(null);

  async function handleAtivar() {
    setStatus(null);
    try {
      const resultado = await inscreverPush();
      if (resultado === 'inscrita') {
        await salvarHorarioPreferido(horario);
        setStatus('Lembretes ativados!');
      } else if (resultado === 'negado') {
        setStatus('Permissão de notificação negada. Você ainda verá um lembrete visual no app.');
      } else {
        setStatus('Seu navegador não suporta notificações push. Você verá um lembrete visual no app.');
      }
    } catch {
      setStatus('Não foi possível ativar os lembretes agora. Tente novamente.');
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Lembretes</h1>
      <label className="block text-texto">
        Horário preferido
        <input
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
        />
      </label>
      <Botao onClick={handleAtivar}>Ativar lembretes</Botao>
      {status && <p className="text-texto">{status}</p>}
    </main>
  );
}
