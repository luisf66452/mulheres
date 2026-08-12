import Cartao from '@/app/components/Cartao';
import AtivarJornadaButton from '@/app/jornadas/AtivarJornadaButton';
import IlustracaoJornada from './IlustracaoJornada';
import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';

export interface CardJornadaExplorarInfo {
  jornadaId: string;
  ilustracaoIndice: IndiceIlustracao;
  titulo: string;
  descricao: string;
  duracaoDias: number;
  quantidadeModulos: number;
  label: string;
}

export default function CardJornadaExplorar({ jornada }: { jornada: CardJornadaExplorarInfo }) {
  return (
    <Cartao className="flex gap-3">
      <IlustracaoJornada indice={jornada.ilustracaoIndice} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="font-display text-base text-texto">{jornada.titulo}</p>
          <p className="line-clamp-2 text-sm text-texto-suave">{jornada.descricao}</p>
        </div>
        <p className="text-xs text-texto-suave">
          {jornada.duracaoDias} dias · {jornada.quantidadeModulos} módulos
        </p>
        <AtivarJornadaButton jornadaId={jornada.jornadaId} jaAtiva={false} label={jornada.label} />
      </div>
    </Cartao>
  );
}
