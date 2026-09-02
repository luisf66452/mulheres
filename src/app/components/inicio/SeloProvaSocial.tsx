export default function SeloProvaSocial({
  animado = false,
  icone = '💛',
  texto = '+500 mulheres já assinam o Rose Pro',
}: {
  animado?: boolean;
  icone?: string;
  texto?: string;
}) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-salvia-suave/50 px-3 py-1 text-xs font-medium text-texto">
      <span className={animado ? 'resultado-selo-animado' : undefined}>{icone}</span> {texto}
    </p>
  );
}
