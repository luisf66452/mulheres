export default function IndicadorEtapas({
  etapaAtual,
  totalEtapas,
}: {
  etapaAtual: number;
  totalEtapas: number;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Etapa ${etapaAtual} de ${totalEtapas}`}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: totalEtapas }, (_, indice) => (
          <span
            key={indice}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${indice < etapaAtual ? 'bg-acao' : 'bg-borda'}`}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-medium text-texto-suave">
        {etapaAtual}/{totalEtapas}
      </span>
    </div>
  );
}
