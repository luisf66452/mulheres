import type { EstadoSessao } from '@/lib/jornadas-conteudo/tipos';

export default function EstadoSessaoIcone({ estado }: { estado: EstadoSessao }) {
  if (estado === 'concluida') {
    return (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-acao"
      >
        <path d="M5 12.5 9.5 17 19 7" />
      </svg>
    );
  }

  if (estado === 'bloqueada') {
    return (
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-texto-suave"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (estado === 'em_andamento') {
    return (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" className="text-acao">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <path d="M12 4a8 8 0 0 1 8 8h-8Z" fill="currentColor" fillOpacity="0.6" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="text-texto-suave"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
