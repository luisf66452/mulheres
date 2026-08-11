import Cartao from '@/app/components/Cartao';
import type { Pratica } from '@/lib/supabase/types';

export default function ConteudoRecomendado({ praticas }: { praticas: Pratica[] }) {
  if (praticas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-lg text-texto">Para explorar</p>
      <div className="space-y-3">
        {praticas.map((pratica) => (
          <Cartao key={pratica.id} className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-destaque">
              {pratica.categoria}
            </span>
            <p className="font-display text-base text-texto">{pratica.titulo}</p>
            <p className="line-clamp-2 text-sm text-texto-suave">{pratica.conteudo}</p>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
