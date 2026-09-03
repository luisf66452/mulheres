// Ramo floral decorativo em SVG — substitui a arte em aquarela do briefing
// original (não há como gerar uma foto/ilustração nova aqui). Reaproveita a
// mesma forma de rosa estilizada de RosasDecorativas, agora composta como um
// ramo com caule e folhas, balançando suavemente via .animate-bloom.
function Flor({ cx, cy, escala = 1 }: { cx: number; cy: number; escala?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${escala})`} fill="var(--eb-rose-burnt)">
      {[0, 72, 144, 216, 288].map((angulo) => (
        <ellipse key={angulo} cx="0" cy="-9" rx="7" ry="10" transform={`rotate(${angulo})`} />
      ))}
      <circle r="4.5" fill="var(--eb-bordo)" />
    </g>
  );
}

function Folha({ cx, cy, rotacao = 0 }: { cx: number; cy: number; rotacao?: number }) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx="5"
      ry="12"
      fill="var(--eb-rose-burnt)"
      opacity="0.55"
      transform={`rotate(${rotacao} ${cx} ${cy})`}
    />
  );
}

export default function RamoFloral({ className, espelhado = false }: { className?: string; espelhado?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 160"
      className={`animate-bloom ${className ?? ''}`}
      aria-hidden="true"
      style={espelhado ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M70 155 C 66 120, 78 90, 62 60 C 50 38, 74 22, 70 5"
        fill="none"
        stroke="var(--eb-rose-burnt)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Folha cx={58} cy={110} rotacao={-30} />
      <Folha cx={76} cy={80} rotacao={25} />
      <Folha cx={54} cy={48} rotacao={-15} />
      <Flor cx={70} cy={8} escala={1.1} />
      <Flor cx={62} cy={62} escala={0.85} />
      <Flor cx={78} cy={95} escala={0.7} />
    </svg>
  );
}
