import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';

const CORES: Record<IndiceIlustracao, string> = {
  0: '#B8697A', // flor — rosa queimado
  1: '#8FA888', // folha — verde sálvia
  2: '#B9A6D4', // onda — lilás
  3: '#E8B894', // sol — pêssego
  4: '#8677A8', // lua — lilás mais escuro
};

export default function IlustracaoJornada({
  indice,
  tamanho = 56,
}: {
  indice: IndiceIlustracao;
  tamanho?: number;
}) {
  const cor = CORES[indice];

  return (
    <svg
      aria-hidden="true"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 56 56"
      fill="none"
      className="shrink-0 rounded-xl"
    >
      <rect width="56" height="56" rx="14" fill={cor} fillOpacity="0.2" />
      {indice === 0 && (
        <path
          d="M28 42c2-9 3-14 9-19-6-3-12 0-13 6-1-6-7-9-13-6 6 5 7 10 9 19z"
          fill={cor}
          fillOpacity="0.6"
        />
      )}
      {indice === 1 && (
        <path
          d="M18 38c2-10 3-15 10-20 7 5 8 10 10 20"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {indice === 2 && (
        <path
          d="M14 30c4-6 8-6 12 0s8 6 12 0 8-6 12 0"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {indice === 3 && <circle cx="28" cy="28" r="10" fill={cor} fillOpacity="0.65" />}
      {indice === 4 && (
        <path d="M32 16a13 13 0 1 0 8 20 10 10 0 0 1-8-20z" fill={cor} fillOpacity="0.65" />
      )}
    </svg>
  );
}
