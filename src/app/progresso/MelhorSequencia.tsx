import { formatarSequencia } from '@/lib/progress/streak';

export default function MelhorSequencia({
  melhorSequencia,
  totalCheckins,
}: {
  melhorSequencia: number;
  totalCheckins: number;
}) {
  if (melhorSequencia === 0) {
    return null;
  }

  return (
    <div className="space-y-1 text-sm text-texto-suave">
      <p>
        Sua melhor sequência até agora:{' '}
        <strong className="text-texto">{formatarSequencia(melhorSequencia)}</strong>
      </p>
      <p>
        Total de check-ins registrados: <strong className="text-texto">{totalCheckins}</strong>
      </p>
    </div>
  );
}
