'use client';

const VALORES = [1, 2, 3, 4, 5];

export default function Escala({
  valor,
  onChange,
}: {
  valor: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {VALORES.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-12 w-12 rounded-full border border-borda transition-colors ${
            valor === n ? 'border-acao bg-acao text-white' : 'bg-superficie text-texto-suave'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
