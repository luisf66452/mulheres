const FORMAS = [
  '60% 40% 55% 45% / 45% 55% 42% 58%',
  '42% 58% 60% 40% / 58% 42% 55% 45%',
  '55% 45% 42% 58% / 40% 60% 45% 55%',
  '45% 55% 58% 42% / 55% 45% 60% 40%',
];

export default function ProgressoBlobs({
  dias,
}: {
  dias: { rotulo: string; completo: boolean }[];
}) {
  return (
    <div className="flex gap-2">
      {dias.map((dia, i) => (
        <div
          key={dia.rotulo}
          title={dia.rotulo}
          className={dia.completo ? 'h-10 w-10 bg-destaque' : 'h-10 w-10 border border-dashed border-borda'}
          style={{ borderRadius: FORMAS[i % FORMAS.length] }}
        />
      ))}
    </div>
  );
}
