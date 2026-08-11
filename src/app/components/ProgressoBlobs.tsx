export default function ProgressoBlobs({
  dias,
}: {
  dias: { rotulo: string; completo: boolean }[];
}) {
  return (
    <div className="flex gap-2">
      {dias.map((dia, i) => (
        <div
          key={i}
          title={dia.rotulo}
          className={dia.completo ? 'h-10 w-10 bg-destaque' : 'h-10 w-10 border border-dashed border-borda'}
          style={{ borderRadius: '60% 40% 55% 45% / 45% 55% 42% 58%' }}
        />
      ))}
    </div>
  );
}
