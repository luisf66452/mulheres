import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import LembreteBanner from '@/app/components/LembreteBanner';
import CheckinFormClient from './CheckinFormClient';

export default async function CheckinPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkinExistente } = await supabase
    .from('checkins')
    .select('id')
    .eq('usuaria_id', user!.id)
    .eq('data', formatDateISO(new Date()))
    .maybeSingle();

  const jaFezCheckinHoje = !!checkinExistente;

  return (
    <>
      <LembreteBanner jaFezCheckinHoje={jaFezCheckinHoje} />
      {jaFezCheckinHoje ? (
        <main className="mx-auto max-w-md space-y-6 p-6">
          <p>Você já fez seu ritual de hoje. Volte amanhã! 🌿</p>
          <a href="/progresso" className="block w-full rounded border p-3 text-center">
            Ver progresso
          </a>
        </main>
      ) : (
        <CheckinFormClient />
      )}
    </>
  );
}
