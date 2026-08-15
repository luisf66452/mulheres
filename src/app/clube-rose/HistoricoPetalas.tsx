import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import Cartao from '@/app/components/Cartao';
import { descreverTransacao, nomeRecompensaPorChave } from '@/lib/clube-rose/historico';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default async function HistoricoPetalas({
  supabase,
  usuariaId,
}: {
  supabase: SupabaseClient<Database>;
  usuariaId: string;
}) {
  const { data: transacoes } = await supabase
    .from('transacoes_petalas')
    .select('id, tipo_evento, referencia_id, quantidade, saldo_resultante, criado_em')
    .eq('usuaria_id', usuariaId)
    .order('criado_em', { ascending: false })
    .limit(30);

  const itens = transacoes ?? [];

  const idsResgatesRecompensa = itens
    .filter((t) => t.tipo_evento === 'resgate_recompensa' || t.tipo_evento === 'estorno_resgate')
    .map((t) => t.referencia_id);

  let chavePorResgateId = new Map<string, string>();
  if (idsResgatesRecompensa.length > 0) {
    const { data: resgates } = await supabase
      .from('resgates_recompensas')
      .select('id, recompensa_chave')
      .in('id', idsResgatesRecompensa);
    chavePorResgateId = new Map((resgates ?? []).map((r) => [r.id, r.recompensa_chave]));
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-texto">Histórico de Pétalas</h2>

      {itens.length === 0 ? (
        <Cartao>
          <p className="text-sm text-texto-suave">
            Ainda não há nenhuma Pétala por aqui — comece com um check-in ou uma prática.
          </p>
        </Cartao>
      ) : (
        <div className="space-y-2">
          {itens.map((item) => {
            const chave = chavePorResgateId.get(item.referencia_id);
            const nomeRecompensa = chave ? nomeRecompensaPorChave(chave) : null;
            const positivo = item.quantidade > 0;
            return (
              <Cartao key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-texto">{descreverTransacao(item.tipo_evento, nomeRecompensa)}</p>
                  <p className="text-xs text-texto-suave">
                    {formatarData(item.criado_em)} · Saldo após: {item.saldo_resultante.toLocaleString('pt-BR')}
                  </p>
                </div>
                <p className={`shrink-0 font-display text-base ${positivo ? 'text-acao' : 'text-texto-suave'}`}>
                  {positivo ? '+' : ''}
                  {item.quantidade.toLocaleString('pt-BR')}
                </p>
              </Cartao>
            );
          })}
        </div>
      )}
    </section>
  );
}
