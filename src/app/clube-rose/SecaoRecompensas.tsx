import { RECOMPENSAS } from '@/lib/clube-rose/recompensas';
import CartaoRecompensa from './CartaoRecompensa';

export default function SecaoRecompensas({
  saldo,
  ehPremium,
  chavesResgatadas,
}: {
  saldo: number;
  ehPremium: boolean;
  chavesResgatadas: Set<string>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-texto">Recompensas</h2>
      <div className="space-y-3">
        {RECOMPENSAS.map((recompensa) => (
          <CartaoRecompensa
            key={recompensa.chave}
            recompensa={recompensa}
            saldo={saldo}
            ehPremium={ehPremium}
            jaResgatada={chavesResgatadas.has(recompensa.chave)}
          />
        ))}
      </div>
    </section>
  );
}
