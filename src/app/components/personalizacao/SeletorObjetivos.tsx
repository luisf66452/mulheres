'use client';

import { useState, useTransition } from 'react';
import Botao from '@/app/components/Botao';
import { OBJETIVOS, OBJETIVO_SENTINELA, type ObjetivoId } from '@/lib/perfil/personalizacao';

export default function SeletorObjetivos({
  selecaoInicial,
  onSalvar,
  aoSalvarComSucesso,
  rotuloBotao = 'Continuar',
}: {
  selecaoInicial: ObjetivoId[];
  onSalvar: (selecionados: ObjetivoId[]) => Promise<{ erro?: string }>;
  aoSalvarComSucesso?: () => void;
  rotuloBotao?: string;
}) {
  const [selecionados, setSelecionados] = useState<ObjetivoId[]>(selecaoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  function alternar(id: ObjetivoId) {
    setSalvo(false);
    if (id === OBJETIVO_SENTINELA) {
      setSelecionados((atual) => (atual.includes(id) ? [] : [id]));
      return;
    }
    setSelecionados((atual) => {
      const semSentinela = atual.filter((item) => item !== OBJETIVO_SENTINELA);
      return semSentinela.includes(id) ? semSentinela.filter((item) => item !== id) : [...semSentinela, id];
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
        {OBJETIVOS.map((objetivo) => (
          <button
            key={objetivo.id}
            type="button"
            onClick={() => alternar(objetivo.id)}
            aria-pressed={selecionados.includes(objetivo.id)}
            className={`rounded-2xl border p-4 text-left font-medium transition-colors ${
              selecionados.includes(objetivo.id)
                ? 'border-acao bg-acao/10 text-texto'
                : 'border-borda bg-superficie text-texto-suave'
            }`}
          >
            {objetivo.rotulo}
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
