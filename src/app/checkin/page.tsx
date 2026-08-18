import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hojeISONoFuso } from '@/lib/date';
import LembreteBanner from '@/app/components/LembreteBanner';
import CheckinFormClient from './CheckinFormClient';
import { validarHumorParam } from '@/lib/checkin/humorInicial';

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ humor?: string | string[] }>;
}) {
  const { humor } = await searchParams;
  const humorInicial = validarHumorParam(humor);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('fuso_horario')
    .eq('id', user.id)
    .single();

  const { data: checkinExistente } = await supabase
    .from('checkins')
    .select('id')
    .eq('usuaria_id', user.id)
    .eq('data', hojeISONoFuso(perfil?.fuso_horario ?? 'America/Sao_Paulo'))
    .maybeSingle();

  const jaFezCheckinHoje = !!checkinExistente;

  return (
    <>
      <LembreteBanner jaFezCheckinHoje={jaFezCheckinHoje} />
      {jaFezCheckinHoje ? (
        <main className="mx-auto max-w-md space-y-6 p-6">
          <p className="text-texto">Você já fez seu ritual de hoje. Volte amanhã! 🌿</p>
          <a
            href="/progresso"
            className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
          >
            Ver progresso
          </a>
        </main>
      ) : (
        <CheckinFormClient humorInicial={humorInicial} />
      )}
    </>
  );
}
