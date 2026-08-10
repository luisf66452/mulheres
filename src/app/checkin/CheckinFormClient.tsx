'use client';

import { useState } from 'react';
import { submeterCheckin } from './actions';

const ESCALA = [1, 2, 3, 4, 5];

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
      <h1 className="text-2xl font-semibold">Como você está hoje?</h1>

      <EscalaPergunta label="Seu humor hoje" valor={humor} onChange={setHumor} />
      <EscalaPergunta label="Como você se sente com seu corpo hoje" valor={imagemCorporal} onChange={setImagemCorporal} />
      <EscalaPergunta label="Sua relação com a comida hoje" valor={comida} onChange={setComida} />

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Espaço opcional para desabafar. Este texto <strong>não é analisado nem monitorado</strong> —
          fica só no seu diário.
        </p>
        <textarea
          value={textoLivre}
          onChange={(e) => setTextoLivre(e.target.value)}
          className="w-full rounded border p-3"
          rows={4}
          placeholder="Se quiser, escreva livremente aqui..."
        />
      </div>

      {erro && <p className="text-red-600">{erro}</p>}

      <button
        disabled={!podeEnviar}
        onClick={handleSubmit}
        className="w-full rounded bg-black p-3 text-white disabled:opacity-40"
      >
        {enviando ? 'Enviando...' : 'Continuar'}
      </button>
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
      <p>{label}</p>
      <div className="flex gap-2">
        {ESCALA.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-12 w-12 rounded-full border ${valor === n ? 'bg-black text-white' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
