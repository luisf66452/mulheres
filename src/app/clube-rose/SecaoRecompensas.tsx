import { RECOMPENSAS } from '@/lib/clube-rose/recompensas';
import type { StatusRecompensaCatalogo } from '@/lib/supabase/types';
import CartaoRecompensa from './CartaoRecompensa';

type LinhaCatalogo = {
  chave: string;
  custo: number;
  requer_premium: boolean;
  status: StatusRecompensaCatalogo;
  estoque: number | null;
};

export default function SecaoRecompensas({
  saldo,
  ehPremium,
  statusPorChave,
  catalogoPorChave,
}: {
  saldo: number;
  ehPremium: boolean;
  statusPorChave: Map<string, string>;
  catalogoPorChave: Map<string, LinhaCatalogo>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-texto">Recompensas</h2>
      <div className="space-y-3">
        {RECOMPENSAS.map((recompensa) => {
          const linhaCatalogo = catalogoPorChave.get(recompensa.chave);
          // Sem linha no catálogo (banco), a recompensa não pode ser
          // resgatada — trata como indisponível em vez de assumir um custo.
          if (!linhaCatalogo) return null;
          return (
            <CartaoRecompensa
              key={recompensa.chave}
              recompensa={recompensa}
              custo={linhaCatalogo.custo}
              disponivel={linhaCatalogo.status === 'ativa'}
              requerPremium={linhaCatalogo.requer_premium}
              semEstoque={linhaCatalogo.estoque !== null && linhaCatalogo.estoque <= 0}
              saldo={saldo}
              ehPremium={ehPremium}
              statusResgate={statusPorChave.get(recompensa.chave) ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}
