import { CAMINHO_PETALA_BOTANICA, TONS_BOTANICOS } from '@/app/components/ilustracoes/RosaBotanica';

// Duas pétalas inclinadas uma em direção à outra, quase se tocando no meio —
// uma forma de acolhimento mútuo, sem ser literal (não são duas mãos nem
// dois corações). Reaproveita a mesma forma de pétala da RosaBotanica.
export default function PetalasAutocompaixao({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 64"
      width={96}
      height={64}
      className={['pointer-events-none select-none', className ?? ''].filter(Boolean).join(' ')}
    >
      <g transform="translate(38 34) rotate(18) scale(1.9)">
        <path d={CAMINHO_PETALA_BOTANICA} fill={TONS_BOTANICOS.rosaQueimado} fillOpacity="0.55" />
      </g>
      <g transform="translate(58 34) rotate(-18) scale(1.9)">
        <path d={CAMINHO_PETALA_BOTANICA} fill={TONS_BOTANICOS.blush} fillOpacity="0.5" />
      </g>
    </svg>
  );
}
