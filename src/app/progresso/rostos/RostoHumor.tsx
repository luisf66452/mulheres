const BOCAS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'M8.5 16.5c1.7-2.2 5.3-2.2 7 0',
  2: 'M9 16c1.5-1 4.5-1 6 0',
  3: 'M9 15.5h6',
  4: 'M9 15c1.5 1.5 4.5 1.5 6 0',
  5: 'M8 14c2.2 2.8 5.8 2.8 8 0',
};

export default function RostoHumor({
  nivel,
  className,
}: {
  nivel: 1 | 2 | 3 | 4 | 5;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" className={className}>
      <circle cx="12" cy="12" r="11" fill={`var(--color-humor-${nivel})`} />
      <circle cx="9" cy="10" r="1.1" fill="var(--color-texto)" />
      <circle cx="15" cy="10" r="1.1" fill="var(--color-texto)" />
      <path d={BOCAS[nivel]} stroke="var(--color-texto)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
