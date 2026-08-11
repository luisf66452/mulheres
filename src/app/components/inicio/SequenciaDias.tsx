import Link from 'next/link';
import { formatarSequencia, type Progresso7Dias } from '@/lib/progress/streak';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-texto">Sua sequência</p>
        {progresso.diasConsecutivosAtuais > 0 && (
          <span className="text-sm text-texto-suave">
            {formatarSequencia(progresso.diasConsecutivosAtuais)}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {progresso.ultimos7Dias.map((dia) => {
          const diaSemana = new Date(`${dia.data}T00:00:00`).getDay();
          return (
            <div key={dia.data} className="flex flex-1 flex-col items-center gap-1">
              <div
                title={dia.data}
                className={
                  dia.completou
                    ? 'h-9 w-full rounded-full bg-destaque'
                    : 'h-9 w-full rounded-full border border-borda bg-superficie'
                }
              />
              <span className="text-[10px] text-texto-suave">{DIAS_SEMANA[diaSemana]}</span>
            </div>
          );
        })}
      </div>

      <Link
        href="/progresso"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Ver meu progresso
      </Link>
    </div>
  );
}
