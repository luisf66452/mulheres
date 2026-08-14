import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoClubeRose from './CabecalhoClubeRose';
import CartaoSaldoPetalas from './CartaoSaldoPetalas';
import SecaoManeirasDeGanhar from './SecaoManeirasDeGanhar';

export default async function ClubeRosePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: carteira } = await supabase
    .from('carteiras_petalas')
    .select('saldo')
    .eq('usuaria_id', user.id)
    .maybeSingle();

  const saldo = carteira?.saldo ?? 0;

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <CabecalhoClubeRose />
      <CartaoSaldoPetalas saldo={saldo} />
      <SecaoManeirasDeGanhar />
      <NavegacaoInferior />
    </main>
  );
}
