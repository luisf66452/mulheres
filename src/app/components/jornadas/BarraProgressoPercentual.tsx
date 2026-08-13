'use client';

import { useEffect, useState } from 'react';

export default function BarraProgressoPercentual({
  percentual,
  className = '',
}: {
  percentual: number;
  className?: string;
}) {
  const valor = Math.max(0, Math.min(100, percentual));
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLargura(valor));
    return () => cancelAnimationFrame(id);
  }, [valor]);

  return (
    <div
      role="progressbar"
      aria-label={`Progresso: ${valor}%`}
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 overflow-hidden rounded-full bg-borda/70 ${className}`}
    >
      <div
        className="h-full rounded-full bg-acao transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}
