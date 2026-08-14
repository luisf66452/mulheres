export default function Cronometro({
  segundosRestantes,
  duracaoTotalS,
  className = '',
}: {
  segundosRestantes: number;
  duracaoTotalS: number;
  className?: string;
}) {
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const rotulo = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  const percentualDecorrido = ((duracaoTotalS - segundosRestantes) / duracaoTotalS) * 100;

  return (
    <div className={className}>
      <p aria-live="off" className="text-center font-display text-4xl tabular-nums text-texto">
        {rotulo}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-borda/60">
        <div
          className="h-full rounded-full bg-acao transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
          style={{ width: `${percentualDecorrido}%` }}
        />
      </div>
    </div>
  );
}
