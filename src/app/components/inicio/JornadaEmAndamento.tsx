import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';

export interface JornadaEmAndamentoInfo {
  titulo: string;
  descricao: string;
  diasCompletados: number;
  duracaoDias: number;
  href: string;
}

export default function JornadaEmAndamento({ jornada }: { jornada: JornadaEmAndamentoInfo | null }) {
  if (!jornada) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Continue sua jornada</p>
      <Link href={jornada.href} className="block">
        <Cartao className="flex gap-3">
          <svg
            aria-hidden="true"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="shrink-0 rounded-xl"
          >
            <rect width="56" height="56" rx="14" fill="var(--color-acao)" fillOpacity="0.15" />
            <path
              d="M18 38c2-10 3-15 10-20 7 5 8 10 10 20"
              stroke="var(--color-acao)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="font-display text-base text-texto">{jornada.titulo}</p>
              <p className="line-clamp-2 text-sm text-texto-suave">{jornada.descricao}</p>
            </div>
            <BarraProgressoJornada
              diasCompletados={jornada.diasCompletados}
              duracaoDias={jornada.duracaoDias}
            />
          </div>
        </Cartao>
      </Link>
    </div>
  );
}
