import type { EstadoCronometro } from '@/lib/praticas-conteudo/useCronometroRegressivo';
import Botao from '@/app/components/Botao';

export default function ControlesSessao({
  estado,
  onPausar,
  onContinuar,
  onReiniciar,
}: {
  estado: EstadoCronometro;
  onPausar: () => void;
  onContinuar: () => void;
  onReiniciar: () => void;
}) {
  return (
    <div className="flex gap-3">
      {estado === 'executando' ? (
        <Botao type="button" variante="secundaria" onClick={onPausar} className="flex-1">
          Pausar
        </Botao>
      ) : (
        <Botao type="button" onClick={onContinuar} className="flex-1">
          Continuar
        </Botao>
      )}
      <Botao type="button" variante="secundaria" onClick={onReiniciar} className="flex-1">
        Reiniciar
      </Botao>
    </div>
  );
}
