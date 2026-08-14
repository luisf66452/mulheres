import Cartao from '@/app/components/Cartao';
import { MANEIRAS_DE_GANHAR } from '@/lib/clube-rose/maneirasDeGanhar';

export default function SecaoManeirasDeGanhar() {
  return (
    <section id="maneiras-de-ganhar" className="scroll-mt-6 space-y-3">
      <h2 className="font-display text-xl text-texto">Maneiras de ganhar Pétalas</h2>
      <div className="space-y-3">
        {MANEIRAS_DE_GANHAR.map((maneira) => (
          <Cartao key={maneira.chave} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-texto">
                {maneira.titulo}
                {!maneira.disponivel && (
                  <span className="ml-2 rounded-full bg-lilas-claro px-2 py-0.5 text-xs font-normal text-acao">
                    Em breve
                  </span>
                )}
              </p>
              <p className="text-sm text-texto-suave">{maneira.descricao}</p>
            </div>
            <p className="shrink-0 font-display text-lg text-acao">+{maneira.petalas}</p>
          </Cartao>
        ))}
      </div>
    </section>
  );
}
