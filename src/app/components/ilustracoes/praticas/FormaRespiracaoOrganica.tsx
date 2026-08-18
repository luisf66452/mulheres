// Forma orgânica (não um círculo geométrico) que "respira": expande devagar
// ao inspirar e recolhe ao expirar, no mesmo ritmo do ciclo real da prática
// (ver DURACAO_INSPIRAR_S/DURACAO_EXPIRAR_S em cicloRespiracao.ts). Mesmo
// padrão de transição já usado no círculo anterior (scale-* + transition
// + motion-reduce:transform-none) — só a forma em si deixou de ser um
// círculo e passou a ser uma pétala arredondada de pontas irregulares.
export default function FormaRespiracaoOrganica({
  emExpansao,
  duracaoSegundos,
  className,
}: {
  emExpansao: boolean;
  duracaoSegundos: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 160"
      width={160}
      height={160}
      className={[
        'pointer-events-none select-none origin-center transition-transform ease-in-out motion-reduce:transform-none',
        emExpansao ? 'scale-100' : 'scale-[0.72]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ transitionDuration: `${duracaoSegundos}s` }}
    >
      <defs>
        <radialGradient id="respiracaoMiolo" cx="45%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#F3CFC1" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#B8697A" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <path
        d="M80,20 C104,28 132,48 132,80 C132,110 108,132 80,140 C52,132 28,110 28,80 C28,48 56,28 80,20 Z"
        fill="url(#respiracaoMiolo)"
      />
      <path
        d="M80,38 C96,44 114,58 114,80 C114,101 98,116 80,122 C62,116 46,101 46,80 C46,58 64,44 80,38 Z"
        fill="#B8697A"
        fillOpacity="0.25"
      />
    </svg>
  );
}
