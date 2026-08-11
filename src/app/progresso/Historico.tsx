import Cartao from '@/app/components/Cartao';
import type { ItemHistorico } from '@/lib/historico/resolverItens';

export default function Historico({ itens }: { itens: ItemHistorico[] }) {
  if (itens.length === 0) {
    return (
      <div className="space-y-1">
        <p className="font-display text-lg text-texto">Histórico</p>
        <p className="text-sm text-texto-suave">Seu histórico de check-ins vai aparecer aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Histórico</p>
      <div className="space-y-2">
        {itens.map(({ checkin, descricaoRitual }) => (
          <Cartao key={checkin.id} className="space-y-1">
            <p className="text-sm font-medium text-texto">{checkin.data}</p>
            <p className="text-xs text-texto-suave">
              Humor {checkin.humor}/5 · Corpo {checkin.imagem_corporal}/5 · Comida{' '}
              {checkin.comida !== null ? `${checkin.comida}/5` : 'não informado'}
            </p>
            <p className="text-xs text-texto-suave">{descricaoRitual ?? 'Nenhuma atividade registrada'}</p>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
