export default function BarraProgressoJornada({
  diasCompletados,
  duracaoDias,
}: {
  diasCompletados: number;
  duracaoDias: number;
}) {
  const percentual =
    duracaoDias > 0 ? Math.min(100, Math.round((diasCompletados / duracaoDias) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-borda">
      <div className="h-full rounded-full bg-destaque" style={{ width: `${percentual}%` }} />
    </div>
  );
}
