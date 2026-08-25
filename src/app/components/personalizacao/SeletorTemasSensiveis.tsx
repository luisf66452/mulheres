'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { TEMAS_SENSIVEIS, TEMA_SENSIVEL_EXCLUSIVOS, type TemaSensivelId } from '@/lib/perfil/personalizacao';

export default function SeletorTemasSensiveis({
  selecaoInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Continuar',
}: {
  selecaoInicial: TemaSensivelId[];
  onSalvar: (selecionados: TemaSensivelId[]) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [selecionados, setSelecionados] = useState<TemaSensivelId[]>(selecaoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function alternar(id: TemaSensivelId) {
    setSalvo(false);
    if (TEMA_SENSIVEL_EXCLUSIVOS.includes(id)) {
      setSelecionados((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setSelecionados((atual) => {
      const semExclusivos = atual.filter((item) => !TEMA_SENSIVEL_EXCLUSIVOS.includes(item));
      return semExclusivos.includes(id) ? semExclusivos.filter((item) => item !== id) : [...semExclusivos, id];
    });
  }

  function handleConfirmar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await onSalvar(selecionados);
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
      <div className="flex flex-col gap-3">
        {TEMAS_SENSIVEIS.map((tema) => (
          <button
            key={tema.id}
            type="button"
            onClick={() => alternar(tema.id)}
            aria-pressed={selecionados.includes(tema.id)}
            className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
              selecionados.includes(tema.id)
                ? 'border-acao bg-acao/10 text-texto'
                : 'border-borda bg-superficie text-texto-suave'
            }`}
          >
            {tema.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="text-alerta">{erro}</p>}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Salvo.
        </p>
      )}

      <Botao disabled={salvando} onClick={handleConfirmar}>
        {salvando ? 'Salvando...' : rotuloBotao}
      </Botao>
    </div>
  );
}
