// Ilustração botânica compartilhada de rosa — pensada para parecer um
// desenho em aquarela (pétalas sobrepostas e assimétricas, sépalas, caule e
// folhas com nervura), não um ícone geométrico. Substitui as "flores" que
// eram só um círculo de elipses idênticas (CartaoSequencia, cabeçalho de
// jornadas, cabeçalho de perfil). Puramente decorativa: sempre
// `aria-hidden`, nunca a única forma de transmitir uma informação.
//
// Cada pétala é descrita como {anguloGraus, raio, escalaX, escalaY, tom,
// opacidade} em vez de coordenadas fixas — o ângulo e o raio de cada uma são
// levemente diferentes entre si de propósito (nunca um múltiplo exato de
// 360/N), para que o conjunto leia como orgânico, não como um polígono
// regular.
export const TONS_BOTANICOS = {
  rosaQueimado: '#B8697A',
  blush: '#D98779',
  pessego: '#F3CFC1',
  salvia: '#8FA888',
} as const;
const TONS = TONS_BOTANICOS;

interface EspecPetala {
  anguloGraus: number;
  raio: number;
  escalaX: number;
  escalaY: number;
  tom: keyof typeof TONS;
  opacidade: number;
  rotacaoExtra: number;
}

// Pétalas externas — mais abertas, giradas em ângulos irregulares (não
// múltiplos de 60°) e com raios/escalas ligeiramente diferentes entre si.
const PETALAS_EXTERNAS: EspecPetala[] = [
  { anguloGraus: 8, raio: 9.5, escalaX: 1, escalaY: 1.15, tom: 'rosaQueimado', opacidade: 0.62, rotacaoExtra: -6 },
  { anguloGraus: 74, raio: 10.5, escalaX: 0.95, escalaY: 1.05, tom: 'blush', opacidade: 0.5, rotacaoExtra: 10 },
  { anguloGraus: 141, raio: 9, escalaX: 1.05, escalaY: 1.1, tom: 'rosaQueimado', opacidade: 0.56, rotacaoExtra: -4 },
  { anguloGraus: 199, raio: 10, escalaX: 0.9, escalaY: 1, tom: 'blush', opacidade: 0.48, rotacaoExtra: 8 },
  { anguloGraus: 262, raio: 9.5, escalaX: 1, escalaY: 1.1, tom: 'rosaQueimado', opacidade: 0.58, rotacaoExtra: -8 },
  { anguloGraus: 322, raio: 10.5, escalaX: 0.92, escalaY: 1.02, tom: 'blush', opacidade: 0.5, rotacaoExtra: 6 },
];

// Pétalas internas — menores, mais fechadas (escalaY menor = mais curtas),
// concentradas perto do centro, tom mais escuro para dar profundidade.
const PETALAS_INTERNAS: EspecPetala[] = [
  { anguloGraus: 30, raio: 4, escalaX: 0.65, escalaY: 0.8, tom: 'rosaQueimado', opacidade: 0.75, rotacaoExtra: 4 },
  { anguloGraus: 155, raio: 4.3, escalaX: 0.6, escalaY: 0.78, tom: 'rosaQueimado', opacidade: 0.7, rotacaoExtra: -6 },
  { anguloGraus: 268, raio: 4, escalaX: 0.62, escalaY: 0.82, tom: 'rosaQueimado', opacidade: 0.72, rotacaoExtra: 5 },
];

// Forma de uma pétala isolada (teardrop assimétrico) desenhada em torno da
// origem, apontando para cima — cada instância é posicionada/rotacionada via
// `transform` no <g> pai. Exportada para reuso em outras ilustrações
// botânicas do app (ex.: pétalas da prática de autocompaixão) em vez de
// duplicar a mesma forma.
export const CAMINHO_PETALA_BOTANICA =
  'M0,-9 C2.6,-6.4 3.4,-2.4 2.6,1.6 C2,4.6 0.6,6.6 0,7.4 C-0.6,6.6 -2.2,4.4 -2.8,1.4 C-3.6,-2.6 -2.6,-6.4 0,-9 Z';
const CAMINHO_PETALA = CAMINHO_PETALA_BOTANICA;

function Petala({ spec, cx, cy }: { spec: EspecPetala; cx: number; cy: number }) {
  const rad = (spec.anguloGraus * Math.PI) / 180;
  const x = cx + spec.raio * Math.cos(rad - Math.PI / 2);
  const y = cy + spec.raio * Math.sin(rad - Math.PI / 2);
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${spec.anguloGraus + spec.rotacaoExtra}) scale(${spec.escalaX} ${spec.escalaY})`}
    >
      <path d={CAMINHO_PETALA} fill={TONS[spec.tom]} fillOpacity={spec.opacidade} />
    </g>
  );
}

export type TamanhoRosaBotanica = 'botao' | 'pequena' | 'media' | 'florAberta';

const DIMENSAO_POR_TAMANHO: Record<TamanhoRosaBotanica, number> = {
  botao: 24,
  pequena: 36,
  media: 56,
  florAberta: 88,
};

export default function RosaBotanica({
  tamanho = 'media',
  className,
  comCaule = true,
  animada = false,
}: {
  tamanho?: TamanhoRosaBotanica;
  className?: string;
  /** Desenha caule e folhas abaixo da flor — desligue para usos onde só a flor cabe (ex.: selo pequeno). */
  comCaule?: boolean;
  /** Entrada suave (fade + leve escala) ao montar; respeita prefers-reduced-motion. */
  animada?: boolean;
}) {
  const dimensao = DIMENSAO_POR_TAMANHO[tamanho];
  const cxFlor = 32;
  const cyFlor = comCaule ? 24 : 32;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width={dimensao}
      height={dimensao}
      className={[
        'pointer-events-none select-none',
        animada ? 'rosa-botanica-entrada' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <defs>
        <radialGradient id="rosaBotanicaMiolo" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={TONS.pessego} stopOpacity="0.9" />
          <stop offset="100%" stopColor={TONS.rosaQueimado} stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="rosaBotanicaSombra" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#453C42" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#453C42" stopOpacity="0" />
        </radialGradient>
      </defs>

      {comCaule && (
        <g>
          {/* Sombra mínima, só sob a base do caule — nunca sob a flor inteira. */}
          <ellipse cx={cxFlor} cy={58} rx={10} ry={2.4} fill="url(#rosaBotanicaSombra)" />

          {/* Caule fino e levemente curvo, não uma linha reta. */}
          <path
            d={`M${cxFlor} ${cyFlor + 9} C ${cxFlor - 3} ${cyFlor + 20}, ${cxFlor + 2.5} ${cyFlor + 28}, ${cxFlor - 1} ${56}`}
            stroke={TONS.salvia}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />

          {/* Duas folhas em alturas/ângulos diferentes, cada uma com nervura central sutil. */}
          <g transform={`translate(${cxFlor - 4} ${cyFlor + 18}) rotate(-38)`}>
            <path
              d="M0,0 C4.5,-1.2 8,1 8.6,5.2 C9,8 7.4,10.4 4.6,11.4 C4.4,7.6 2.6,3.4 0,0 Z"
              fill={TONS.salvia}
              fillOpacity="0.55"
            />
            <path d="M1,1 C4,3.6 5.6,6.8 5.2,10.2" stroke="#5F7A5A" strokeOpacity="0.4" strokeWidth="0.5" fill="none" />
          </g>
          <g transform={`translate(${cxFlor + 3} ${cyFlor + 27}) rotate(28)`}>
            <path
              d="M0,0 C-5,-0.6 -8.4,2 -8.8,6.4 C-9,9.2 -7.2,11.4 -4.2,12.2 C-4.2,8.2 -2.2,3.6 0,0 Z"
              fill={TONS.salvia}
              fillOpacity="0.48"
            />
            <path d="M-1,1 C-4,3.8 -5.4,7.2 -4.8,10.6" stroke="#5F7A5A" strokeOpacity="0.35" strokeWidth="0.5" fill="none" />
          </g>
        </g>
      )}

      {/* Sépalas discretas na base da flor, parcialmente cobertas pelas pétalas externas. */}
      <g opacity={0.5}>
        <path
          d={`M${cxFlor} ${cyFlor + 6} C ${cxFlor - 4} ${cyFlor + 4}, ${cxFlor - 5.5} ${cyFlor}, ${cxFlor - 3} ${cyFlor - 3} C ${cxFlor - 2} ${cyFlor + 1}, ${cxFlor} ${cyFlor + 4}, ${cxFlor} ${cyFlor + 6} Z`}
          fill={TONS.salvia}
        />
        <path
          d={`M${cxFlor} ${cyFlor + 6} C ${cxFlor + 4} ${cyFlor + 4}, ${cxFlor + 5.5} ${cyFlor}, ${cxFlor + 3} ${cyFlor - 3} C ${cxFlor + 2} ${cyFlor + 1}, ${cxFlor} ${cyFlor + 4}, ${cxFlor} ${cyFlor + 6} Z`}
          fill={TONS.salvia}
        />
      </g>

      {/* Pétalas externas, depois internas por cima — dá a profundidade de camadas sobrepostas. */}
      {PETALAS_EXTERNAS.map((spec, indice) => (
        <Petala key={`ext-${indice}`} spec={spec} cx={cxFlor} cy={cyFlor} />
      ))}
      <circle cx={cxFlor} cy={cyFlor} r={4.6} fill="url(#rosaBotanicaMiolo)" />
      {PETALAS_INTERNAS.map((spec, indice) => (
        <Petala key={`int-${indice}`} spec={spec} cx={cxFlor} cy={cyFlor} />
      ))}
    </svg>
  );
}
