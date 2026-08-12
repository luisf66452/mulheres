import Link from 'next/link';
import { formatarSequencia, type Progresso7Dias } from '@/lib/progress/streak';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <div className="min-w-0 flex-1 space-y-3">
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
                  <span
                    title={dia.data}
                    className={
                      dia.completou
                        ? 'block h-3 w-3 rounded-full bg-destaque'
                        : 'block h-3 w-3 rounded-full border border-borda'
                    }
                  />
                  <span className="text-[10px] text-texto-suave">{DIAS_SEMANA[diaSemana]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" className="shrink-0">
          <path
            d="M28 49c2.5-12 3.5-19 10.5-26-7-3.5-14 0-15.5 7-1.5-7-8.5-10.5-15.5-7 7 7 8 14 10.5 26z"
            fill="#B9A6D4"
            fillOpacity="0.3"
          />
          <circle cx="28" cy="16" r="5" fill="#B8697A" fillOpacity="0.55" />
        </svg>
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
