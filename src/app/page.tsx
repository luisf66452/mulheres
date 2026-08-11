import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import FundoDecorativo from '@/app/components/inicio/FundoDecorativo';
import Saudacao from '@/app/components/inicio/Saudacao';
import ResumoDoDia from '@/app/components/inicio/ResumoDoDia';
import RitualDeHoje from '@/app/components/inicio/RitualDeHoje';
import SequenciaDias from '@/app/components/inicio/SequenciaDias';
import MensagemAcolhedora from '@/app/components/inicio/MensagemAcolhedora';
import ConteudoRecomendado from '@/app/components/inicio/ConteudoRecomendado';

export default async function InicioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = formatDateISO(new Date());

  const [{ data: checkinHoje }, { data: checkins }, { data: praticas }] = await Promise.all([
    supabase.from('checkins').select('*').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
    supabase.from('checkins').select('data').eq('usuaria_id', user!.id),
    supabase.from('praticas').select('*').eq('status', 'publicada').order('criado_em').limit(3),
  ]);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());

  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-24 md:pb-6">
      <FundoDecorativo />

      <Saudacao />

      <ResumoDoDia checkinHoje={checkinHoje} />

      <RitualDeHoje jaFezCheckinHoje={!!checkinHoje} />

      <SequenciaDias progresso={progresso} />

      <MensagemAcolhedora />

      <ConteudoRecomendado praticas={praticas ?? []} />

      <NavegacaoInferior />
    </main>
  );
}
