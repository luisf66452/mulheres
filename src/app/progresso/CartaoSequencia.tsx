import { descreverSequencia, type ProgressoDia } from '@/lib/progress/streak';
import RosaBotanica from '@/app/components/ilustracoes/RosaBotanica';

export default function CartaoSequencia({
  diasConsecutivosAtuais,
  totalCheckins,
  ultimos7Dias,
}: {
  diasConsecutivosAtuais: number;
  totalCheckins: number;
  ultimos7Dias: ProgressoDia[];
}) {
  const { titulo, mensagem } = descreverSequencia(diasConsecutivosAtuais, totalCheckins);

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="font-display text-xl text-texto">{titulo}</h2>
        <p className="text-sm text-texto-suave">{mensagem}</p>
        <div className="flex gap-2 pt-1" role="list" aria-label="Dias com check-in nos últimos 7 dias">
          {ultimos7Dias.map((dia) => (
            <span
              key={dia.data}
              role="listitem"
              aria-label={dia.completou ? `Dia com check-in: ${dia.data}` : `Dia sem check-in: ${dia.data}`}
              className={`h-2.5 w-2.5 rounded-full ${dia.completou ? 'bg-acao' : 'bg-borda'}`}
            />
          ))}
        </div>
      </div>

      <RosaBotanica tamanho="media" comCaule={false} className="shrink-0" />
    </div>
  );
}
