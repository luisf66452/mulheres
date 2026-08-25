// Ícone genérico para práticas de áudio do banco cuja categoria não tem
// ícone específico definido (ex.: "aterramento") — fallback sensato de onda
// sonora, já que toda prática nesse catálogo tem áudio guiado.
export default function IconeOndaSonora({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12h2" />
      <path d="M7 8v8" />
      <path d="M11 5v14" />
      <path d="M15 8v8" />
      <path d="M19 10v4" />
      <path d="M22 12h-1" />
    </svg>
  );
}
