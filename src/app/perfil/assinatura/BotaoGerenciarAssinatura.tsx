'use client';

import { useState } from 'react';
import Botao from '@/app/components/Botao';

export default function BotaoGerenciarAssinatura() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function abrirPortal() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/stripe/portal', { method: 'POST' });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.url) {
        setErro(dados.erro ?? 'Não foi possível abrir o gerenciamento de assinatura agora.');
        setCarregando(false);
        return;
      }
      window.location.href = dados.url;
    } catch {
      setErro('Não foi possível abrir o gerenciamento de assinatura agora.');
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-2">
      <Botao type="button" variante="secundaria" disabled={carregando} onClick={abrirPortal} className="w-full">
        {carregando ? 'Abrindo…' : 'Gerenciar ou cancelar assinatura'}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}
