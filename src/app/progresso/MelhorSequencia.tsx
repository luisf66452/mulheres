import { formatarSequencia } from '@/lib/progress/streak';
import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';

export default function MelhorSequencia({ melhorSequencia }: { melhorSequencia: number }) {
  if (melhorSequencia === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <RosaBotanica
        tamanho="pequena"
        comCaule={false}
        className="pointer-events-none absolute -right-1 -top-1 opacity-[0.1]"
      />
      <div className="relative space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">Sua melhor sequência</p>
        <p className="font-display text-3xl text-texto">{formatarSequencia(melhorSequencia)}</p>
        <p className="max-w-[34ch] text-sm leading-relaxed text-texto-suave">
          Este resumo mostra apenas o que você registrou. Ele não interpreta por que seus dias foram
          assim — cada semana pode ter um ritmo diferente.
        </p>
      </div>
    </div>
  );
}
