'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';
import Botao from '@/app/components/Botao';
import Escala from '@/app/components/Escala';

export default function CheckinFormClient() {
  const [humor, setHumor] = useState<number | null>(null);
  const [imagemCorporal, setImagemCorporal] = useState<number | null>(null);
  const [comida, setComida] = useState<number | null>(null);
  const [textoLivre, setTextoLivre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const podeEnviar = humor !== null && imagemCorporal !== null && comida !== null && !enviando;

  async function handleSubmit() {
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      await submeterCheckin({
        humor: humor!,
        imagemCorporal: imagemCorporal!,
        comida: comida!,
        textoLivre: textoLivre.trim() || undefined,
      });
    } catch {
      setErro('Algo deu errado ao salvar seu check-in. Tente novamente.');
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-8 p-6">
      <h1 className="font-display text-2xl text-texto">Como você está hoje?</h1>

      <EscalaPergunta label="Seu humor hoje" valor={humor} onChange={setHumor} />
      <EscalaPergunta
        label="Como você se sente com seu corpo hoje"
        valor={imagemCorporal}
        onChange={setImagemCorporal}
      />
      <EscalaPergunta label="Sua relação com a comida hoje" valor={comida} onChange={setComida} />

      <div className="space-y-2">
        <p className="text-sm text-texto-suave">
          Espaço opcional para desabafar. Este texto <strong>não é analisado nem monitorado</strong> —
          fica só no seu diário.
        </p>
        <textarea
          value={textoLivre}
          onChange={(e) => setTextoLivre(e.target.value)}
          className="w-full rounded-2xl border border-borda bg-superficie p-3 text-texto"
          rows={4}
          placeholder="Se quiser, escreva livremente aqui..."
        />
      </div>

      {erro && <p className="text-alerta">{erro}</p>}

      <Botao disabled={!podeEnviar} onClick={handleSubmit}>
        {enviando ? 'Enviando...' : 'Continuar'}
      </Botao>
    </main>
  );
}

function EscalaPergunta({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-texto">{label}</p>
      <Escala valor={valor} onChange={onChange} />
    </div>
  );
}
