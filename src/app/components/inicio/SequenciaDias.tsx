import Link from 'next/link';
import type { Progresso7Dias } from '@/lib/progress/streak';

function tituloSequencia(dias: number): string {
  if (dias === 0) return 'Comece sua sequência hoje';
  if (dias === 1) return '1 dia de sequência';
  return `${dias} dias de sequência`;
}

function IlustracaoRosaVaso() {
  return (
    <svg aria-hidden="true" width="64" height="72" viewBox="0 0 64 72" fill="none" className="shrink-0">
      <path d="M32 52c-2-12 2-22 0-32" stroke="var(--color-salvia)" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 40c-6-2-10 2-11 7 6 0 10-3 11-7Z" fill="var(--color-salvia)" fillOpacity="0.55" />
      <path d="M32 34c6-2 10 1 11 6-6 1-10-2-11-6Z" fill="var(--color-salvia)" fillOpacity="0.55" />
      <circle cx="32" cy="16" r="9" fill="var(--color-acao)" fillOpacity="0.2" />
      <path
        d="M32 9c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7Z"
        fill="var(--color-acao)"
      />
      <path
        d="M32 12.5c2.5 0 4.5 2 4.5 4.5S34.5 21.5 32 21.5s-4.5-2-4.5-4.5S29.5 12.5 32 12.5Z"
        fill="var(--color-alerta)"
        fillOpacity="0.55"
      />
      <rect x="20" y="49" width="24" height="4" rx="2" fill="var(--color-pessego)" fillOpacity="0.6" />
      <path
        d="M22 53h20l-2.6 14.2a2 2 0 0 1-2 1.65H26.6a2 2 0 0 1-2-1.65L22 53Z"
        fill="var(--color-pessego)"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export default function SequenciaDias({ progresso }: { progresso: Progresso7Dias }) {
  const titulo = tituloSequencia(progresso.diasConsecutivosAtuais);
  const subtitulo =
    progresso.diasConsecutivosAtuais > 0
      ? 'Continue assim! Você está cuidando de você.'
      : 'Seu primeiro check-in começa a sequência.';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-display text-lg text-texto">{titulo}</p>
            <p className="text-sm text-texto-suave">{subtitulo}</p>
          </div>
          <div className="flex gap-2">
            {progresso.ultimos7Dias.map((dia) => (
              <span
                key={dia.data}
                title={dia.data}
                className={
                  dia.completou
                    ? 'block h-3 w-3 rounded-full bg-acao'
                    : 'block h-3 w-3 rounded-full border border-borda'
                }
              />
            ))}
          </div>
        </div>

        <IlustracaoRosaVaso />
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
