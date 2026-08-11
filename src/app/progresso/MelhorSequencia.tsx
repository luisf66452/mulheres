import { formatarSequencia } from '@/lib/progress/streak';

export default function MelhorSequencia({ melhorSequencia }: { melhorSequencia: number }) {
  if (melhorSequencia === 0) {
    return null;
  }

  return (
    <p className="text-sm text-texto-suave">
      Sua melhor sequência até agora:{' '}
      <strong className="text-texto">{formatarSequencia(melhorSequencia)}</strong>
    </p>
  );
}
