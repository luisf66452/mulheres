import Cartao from '@/app/components/Cartao';
import BotaoRemoverFavorito from './BotaoRemoverFavorito';
import type { TipoFavorito } from './actions';

export default function CartaoFavoritoIndisponivel({ tipo, id }: { tipo: TipoFavorito; id: string }) {
  return (
    <Cartao className="flex items-center justify-between gap-3 opacity-70">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-base text-texto">Conteúdo indisponível</p>
        <p className="text-sm text-texto-suave">
          {tipo === 'pratica' ? 'Esta prática não está mais disponível.' : 'Esta sessão não está mais disponível.'}
        </p>
      </div>
      <BotaoRemoverFavorito tipo={tipo} id={id} />
    </Cartao>
  );
}
