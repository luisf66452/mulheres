// Pequeno ramo botânico (caule + duas folhas com nervura), no espírito de
// uma página de caderno com um detalhe delicado desenhado na margem —
// estático, sem animação, para não competir com a atenção que a escrita
// pede.
export default function RamoDiario({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 40"
      width={96}
      height={40}
      className={['pointer-events-none select-none', className ?? ''].filter(Boolean).join(' ')}
    >
      <path
        d="M4 34 C 22 30, 40 24, 60 14 C 70 9, 80 7, 92 6"
        stroke="#8FA888"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <g transform="translate(28 27) rotate(-18)">
        <path
          d="M0,0 C5,-1.4 9,1.2 9.6,5.8 C10,9 8.2,11.6 5,12.6 C4.8,8.4 2.8,3.6 0,0 Z"
          fill="#8FA888"
          fillOpacity="0.55"
        />
        <path d="M1,1 C4.4,4 6.2,7.6 5.8,11.4" stroke="#5F7A5A" strokeOpacity="0.4" strokeWidth="0.5" fill="none" />
      </g>
      <g transform="translate(58 15) rotate(20)">
        <path
          d="M0,0 C5,-1.2 8.8,1.4 9.2,5.8 C9.4,8.8 7.6,11.2 4.6,12 C4.6,8 2.6,3.4 0,0 Z"
          fill="#8FA888"
          fillOpacity="0.48"
        />
        <path d="M1,1 C4.2,3.8 6,7.2 5.6,10.8" stroke="#5F7A5A" strokeOpacity="0.35" strokeWidth="0.5" fill="none" />
      </g>
      <circle cx="92" cy="6" r="2.4" fill="#B8697A" fillOpacity="0.5" />
    </svg>
  );
}
