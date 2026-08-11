import { decidirEstadoGrafico } from '@/lib/grafico/estado';
import { calcularPontosLinha, type PontoGrafico } from '@/lib/grafico/pontos';
import type { Checkin } from '@/lib/supabase/types';

const LARGURA = 300;
const ALTURA = 140;

function construirPath(pontos: PontoGrafico[]): string {
  return pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

export default function GraficoEvolucao({ checkins }: { checkins: Checkin[] }) {
  const estado = decidirEstadoGrafico(checkins.length);

  if (estado === 'sem_dados') {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Sua evolução</p>
        <p className="text-sm text-texto-suave">
          Faça seu primeiro check-in para começar a ver sua evolução aqui.
        </p>
      </div>
    );
  }

  if (estado === 'poucos_dados') {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Sua evolução</p>
        <p className="text-sm text-texto-suave">
          Faça mais alguns check-ins para começar a ver uma tendência aqui.
        </p>
      </div>
    );
  }

  const pontosHumor = calcularPontosLinha(checkins.map((c) => c.humor), LARGURA, ALTURA);
  const pontosCorpo = calcularPontosLinha(checkins.map((c) => c.imagem_corporal), LARGURA, ALTURA);
  const pontosComida = calcularPontosLinha(checkins.map((c) => c.comida), LARGURA, ALTURA);

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Sua evolução</p>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de evolução de humor, imagem corporal e comida ao longo do tempo"
      >
        <path
          d={construirPath(pontosHumor)}
          fill="none"
          className="stroke-acao"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={construirPath(pontosCorpo)}
          fill="none"
          className="stroke-destaque"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={construirPath(pontosComida)}
          fill="none"
          className="stroke-texto"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-acao" /> Humor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destaque" /> Imagem corporal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-texto" /> Comida
        </span>
      </div>
    </div>
  );
}
