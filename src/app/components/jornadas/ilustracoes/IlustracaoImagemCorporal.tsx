// Silhueta abstrata e sem rosto — deliberadamente sem contorno corporal
// específico, para não sugerir um formato de corpo "ideal". Ver pedido de
// referência: acolhimento e neutralidade corporal, não idealização.
export default function IlustracaoImagemCorporal({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 220"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
    >
      <path
        d="M112 214c-7-21-11-31-11-44 0-11 5-17 5-17-10-5-16-15-16-26 0-17 14-31 31-31s31 14 31 31c0 11-6 21-16 26 0 0 5 6 5 17 0 13-4 23-11 44z"
        fill="#B8697A"
        fillOpacity="0.28"
      />
      <path
        d="M152 132c7 2 12 9 12 9"
        stroke="#B8697A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M40 46c15 6 24 19 24 19"
        stroke="#E8B894"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <g transform="translate(160 122) scale(0.55)" opacity="0.75">
        <ellipse rx="7" ry="11" fill="#8FA888" />
        <ellipse rx="7" ry="11" fill="#8FA888" transform="rotate(72)" />
        <ellipse rx="7" ry="11" fill="#8FA888" transform="rotate(144)" />
        <ellipse rx="7" ry="11" fill="#8FA888" transform="rotate(216)" />
        <ellipse rx="7" ry="11" fill="#8FA888" transform="rotate(288)" />
        <circle r="4" fill="#E8B894" />
      </g>
      <circle cx="46" cy="90" r="2.5" fill="#B8697A" fillOpacity="0.4" />
    </svg>
  );
}
