import { descreverSequencia, type ProgressoDia } from '@/lib/progress/streak';

export default function CartaoSequencia({
  diasConsecutivosAtuais,
  totalCheckins,
  ultimos7Dias,
}: {
  diasConsecutivosAtuais: number;
  totalCheckins: number;
  ultimos7Dias: ProgressoDia[];
}) {
  const diasAtivosUltimos7 = ultimos7Dias.map((dia) => dia.completou);
  const fezCheckinHoje = diasAtivosUltimos7[diasAtivosUltimos7.length - 1] ?? false;
  const { titulo, mensagem } = descreverSequencia({
    diasConsecutivosAtuais,
    totalCheckins,
    diasAtivosUltimos7,
    fezCheckinHoje,
  });

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

      <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" className="shrink-0">
        <path
          d="M28 49c2.5-12 3.5-19 10.5-26-7-3.5-14 0-15.5 7-1.5-7-8.5-10.5-15.5-7 7 7 8 14 10.5 26z"
          fill="#B9A6D4"
          fillOpacity="0.3"
        />
        <circle cx="28" cy="16" r="5" fill="#B8697A" fillOpacity="0.55" />
      </svg>
    </div>
  );
}
