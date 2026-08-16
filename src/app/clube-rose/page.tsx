import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import { contarEtapasDesafioSemanal, semanaInicioISO } from '@/lib/clube-rose/progressoDesafioSemanal';
import CabecalhoClubeRose from './CabecalhoClubeRose';
import CartaoSaldoPetalas from './CartaoSaldoPetalas';
import CartaoDesafioSemanal from './CartaoDesafioSemanal';
import SecaoManeirasDeGanhar from './SecaoManeirasDeGanhar';
import SecaoRecompensas from './SecaoRecompensas';
import HistoricoPetalas from './HistoricoPetalas';

export default async function ClubeRosePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [
    { data: carteira },
    etapasConcluidas,
    { data: resgateSemana },
    { data: perfil },
    { data: resgatesRecompensas },
    { data: catalogo },
  ] = await Promise.all([
    supabase.from('carteiras_petalas').select('saldo').eq('usuaria_id', user.id).maybeSingle(),
    contarEtapasDesafioSemanal(supabase, user.id),
    supabase
      .from('resgates_desafio_semanal')
      .select('id')
      .eq('usuaria_id', user.id)
      .eq('semana_inicio', semanaInicioISO())
      .maybeSingle(),
    supabase.from('perfis').select('plano').eq('id', user.id).single(),
    supabase.from('resgates_recompensas').select('recompensa_chave, status').eq('usuaria_id', user.id),
    supabase.from('recompensas_catalogo').select('chave, custo, requer_premium, status, estoque'),
  ]);

  const saldo = carteira?.saldo ?? 0;
  const ehPremium = perfil?.plano === 'premium';
  // Se a mesma recompensa aparecer mais de uma vez (ex.: um pedido recusado
  // antigo e um novo pedido ativo), o índice parcial em 0015 garante que só
  // um deles não está em estado final — priorizamos o mais recente.
  const statusPorChave = new Map<string, string>();
  for (const r of resgatesRecompensas ?? []) {
    statusPorChave.set(r.recompensa_chave, r.status);
  }
  const catalogoPorChave = new Map((catalogo ?? []).map((c) => [c.chave, c]));

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <CabecalhoClubeRose />
      <CartaoSaldoPetalas saldo={saldo} ehPremium={ehPremium} />
      <CartaoDesafioSemanal etapasConcluidas={etapasConcluidas} resgatado={!!resgateSemana} />
      <SecaoManeirasDeGanhar />
      <SecaoRecompensas
        saldo={saldo}
        ehPremium={ehPremium}
        statusPorChave={statusPorChave}
        catalogoPorChave={catalogoPorChave}
      />
      <HistoricoPetalas supabase={supabase} usuariaId={user.id} />
      <NavegacaoInferior />
    </main>
  );
}
