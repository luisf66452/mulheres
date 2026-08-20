'use client';

import type { CampoExercicio, ValorCampo } from '@/lib/jornadas-modulos/tipos';

export default function CampoExercicioInput({
  campo,
  valor,
  onChange,
}: {
  campo: CampoExercicio;
  valor: ValorCampo | undefined;
  onChange: (valor: ValorCampo) => void;
}) {
  const rotulo = (
    <label className="block font-medium text-texto" htmlFor={campo.id}>
      {campo.rotulo}
      {campo.opcional && <span className="ml-1 font-normal text-texto-suave">(opcional)</span>}
    </label>
  );

  if (campo.tipo === 'texto_curto') {
    return (
      <div className="space-y-2">
        {rotulo}
        <input
          id={campo.id}
          type="text"
          className="w-full rounded-xl border border-borda bg-superficie p-3 text-texto"
          placeholder={campo.placeholder}
          maxLength={campo.maxCaracteres}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (campo.tipo === 'texto_longo') {
    return (
      <div className="space-y-2">
        {rotulo}
        <textarea
          id={campo.id}
          rows={4}
          className="w-full rounded-xl border border-borda bg-superficie p-3 text-texto"
          placeholder={campo.placeholder}
          maxLength={campo.maxCaracteres}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (campo.tipo === 'escolha_unica') {
    return (
      <fieldset className="space-y-2">
        <legend className="font-medium text-texto">
          {campo.rotulo}
          {campo.opcional && <span className="ml-1 font-normal text-texto-suave">(opcional)</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {campo.opcoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => onChange(opcao)}
              aria-pressed={valor === opcao}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                valor === opcao
                  ? 'border-acao bg-acao text-white'
                  : 'border-borda bg-superficie text-texto-suave'
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (campo.tipo === 'multipla_escolha') {
    const selecionadas = Array.isArray(valor) ? valor : [];
    return (
      <fieldset className="space-y-2">
        <legend className="font-medium text-texto">
          {campo.rotulo}
          {campo.opcional && <span className="ml-1 font-normal text-texto-suave">(opcional)</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {campo.opcoes.map((opcao) => {
            const marcada = selecionadas.includes(opcao);
            return (
              <button
                key={opcao}
                type="button"
                onClick={() =>
                  onChange(marcada ? selecionadas.filter((v) => v !== opcao) : [...selecionadas, opcao])
                }
                aria-pressed={marcada}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  marcada ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
                }`}
              >
                {opcao}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // campo.tipo === 'escala'
  const valoresEscala = Array.from({ length: campo.max - campo.min + 1 }, (_, i) => campo.min + i);
  return (
    <div className="space-y-2">
      {rotulo}
      <div className="flex items-center justify-between text-xs text-texto-suave">
        <span>{campo.rotuloMin}</span>
        <span>{campo.rotuloMax}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {valoresEscala.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={valor === n}
            className={`h-10 w-10 rounded-full border text-sm transition-colors ${
              valor === n ? 'border-acao bg-acao text-white' : 'border-borda bg-superficie text-texto-suave'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
