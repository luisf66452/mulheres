import Cartao from '@/app/components/Cartao';
import { DESAFIO_SEMANAL } from '@/lib/clube-rose/desafioSemanal';

export default function CartaoDesafioSemanal({
  etapasConcluidas,
  resgatado,
}: {
  etapasConcluidas: number;
  resgatado: boolean;
}) {
  const progresso = Math.min(etapasConcluidas, DESAFIO_SEMANAL.meta);
  const percentual = Math.round((progresso / DESAFIO_SEMANAL.meta) * 100);

  return (
    <Cartao className="space-y-3">
      <div>
        <p className="text-sm text-texto-suave">Desafio da semana</p>
        <h2 className="font-display text-lg text-texto">{DESAFIO_SEMANAL.titulo}</h2>
        <p className="mt-1 text-sm text-texto-suave">{DESAFIO_SEMANAL.descricao}</p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={progresso}
        aria-valuemin={0}
        aria-valuemax={DESAFIO_SEMANAL.meta}
        aria-label={`${progresso} de ${DESAFIO_SEMANAL.meta} práticas concluídas nesta semana`}
        className="h-2 w-full overflow-hidden rounded-full bg-borda/50"
      >
        <div className="h-full rounded-full bg-acao transition-all" style={{ width: `${percentual}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-texto-suave">
          {progresso} de {DESAFIO_SEMANAL.meta} práticas
        </p>
        <p className="font-display text-base text-acao">+{DESAFIO_SEMANAL.recompensa} Pétalas</p>
      </div>

      {resgatado && (
        <p className="text-sm font-medium text-acao">
          Desafio concluído esta semana — suas Pétalas já foram guardadas. 🌸
        </p>
      )}
    </Cartao>
  );
}
