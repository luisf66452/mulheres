import Link from 'next/link';
import Cartao from '@/app/components/Cartao';
import BarraProgressoJornada from '@/app/components/BarraProgressoJornada';
import AtivarJornadaButton from '@/app/jornadas/AtivarJornadaButton';
import IlustracaoJornada from './IlustracaoJornada';
import type { IndiceIlustracao } from '@/lib/jornadas/ilustracoes';
import type { ResultadoLinkAtividade } from '@/lib/jornadas/emAndamento';

export type SuaJornadaAtualProps =
  | {
      tipo: 'ativa';
      ilustracaoIndice: IndiceIlustracao;
      titulo: string;
      modulo: number;
      sessao: number;
      diasCompletados: number;
      duracaoDias: number;
      emRevisao: boolean;
      linkAtividade: ResultadoLinkAtividade;
    }
  | {
      tipo: 'recomendada';
      ilustracaoIndice: IndiceIlustracao;
      jornadaId: string;
      titulo: string;
      descricao: string;
    }
  | {
      tipo: 'conquista';
      ilustracaoIndice: IndiceIlustracao;
      jornadaId: string;
    }
  | { tipo: 'vazia' };

export default function SuaJornadaAtual(props: SuaJornadaAtualProps) {
  if (props.tipo === 'vazia') {
    return null;
  }

  if (props.tipo === 'ativa') {
    const percentual =
      props.duracaoDias > 0
        ? Math.min(100, Math.round((props.diasCompletados / props.duracaoDias) * 100))
        : 0;

    return (
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">Sua jornada atual</p>
        <Cartao className="space-y-4 p-6">
          <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
          <div className="space-y-1">
            <p className="font-display text-xl text-texto">{props.titulo}</p>
            <p className="text-sm text-texto-suave">
              Módulo {props.modulo} · Sessão {props.sessao}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm text-texto-suave">
              <span>Progresso</span>
              <span>{percentual}%</span>
            </div>
            <BarraProgressoJornada
              diasCompletados={props.diasCompletados}
              duracaoDias={props.duracaoDias}
            />
          </div>
          {props.linkAtividade.tipo === 'indisponivel' ? (
            <p className="text-sm text-texto-suave">
              O próximo conteúdo dessa jornada ainda está sendo preparado — volte em breve.
            </p>
          ) : (
            <>
              <p className="text-xs text-texto-suave">
                {props.emRevisao
                  ? 'Revisitando essa jornada desde o início'
                  : 'Próxima sessão: ~5 minutos'}
              </p>
              <Link
                href={props.linkAtividade.href}
                className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
              >
                {props.emRevisao ? 'Revisitar jornada' : 'Continuar jornada'}
              </Link>
            </>
          )}
          <p className="text-center text-sm italic text-texto-suave">
            Um passo de cada vez — você está indo bem.
          </p>
        </Cartao>
      </div>
    );
  }

  if (props.tipo === 'recomendada') {
    return (
      <div className="space-y-3">
        <p className="font-display text-lg text-texto">Sua jornada atual</p>
        <Cartao className="space-y-3 p-6 text-center">
          <div className="flex justify-center">
            <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
          </div>
          <p className="font-display text-lg text-texto">{props.titulo}</p>
          <p className="text-sm text-texto-suave">{props.descricao}</p>
          <AtivarJornadaButton jornadaId={props.jornadaId} jaAtiva={false} label="Começar uma jornada" />
        </Cartao>
      </div>
    );
  }

  // props.tipo === 'conquista'
  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Sua jornada atual</p>
      <Cartao className="space-y-3 p-6 text-center">
        <div className="flex justify-center">
          <IlustracaoJornada indice={props.ilustracaoIndice} tamanho={72} />
        </div>
        <p className="font-display text-lg text-texto">
          Você concluiu todas as suas jornadas disponíveis!
        </p>
        <p className="text-sm text-texto-suave">Que tal reviver uma delas com um novo olhar?</p>
        <AtivarJornadaButton jornadaId={props.jornadaId} jaAtiva={false} label="Revisitar jornada" />
      </Cartao>
    </div>
  );
}
