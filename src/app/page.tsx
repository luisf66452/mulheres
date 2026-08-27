import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hojeISONoFuso, hojeNoFuso } from '@/lib/date';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import { buscarJornadaAtivaParaExibir } from '@/lib/jornadas/buscarJornadaAtivaParaExibir';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import FundoDecorativo from '@/app/components/inicio/FundoDecorativo';
import Saudacao from '@/app/components/inicio/Saudacao';
import ResumoDoDia from '@/app/components/inicio/ResumoDoDia';
import RitualDeHoje from '@/app/components/inicio/RitualDeHoje';
import SeletorHumor from '@/app/components/inicio/SeletorHumor';
import SequenciaDias from '@/app/components/inicio/SequenciaDias';
import MensagemAcolhedora from '@/app/components/inicio/MensagemAcolhedora';
import JornadaEmAndamento, { type JornadaEmAndamentoInfo } from '@/app/components/inicio/JornadaEmAndamento';
import ContinuarDeOndeParei from '@/app/components/inicio/ContinuarDeOndeParei';
import CartaoClubeRose from '@/app/components/inicio/CartaoClubeRose';
import TikTokCompleteRegistration from '@/app/components/tiktok/TikTokCompleteRegistration';
import MetaCompleteRegistration from '@/app/components/meta/MetaCompleteRegistration';
import InstalarRose from '@/app/components/InstalarRose';
import AvisoSeguranca from '@/app/components/seguranca/AvisoSeguranca';
import OfertaRoseProAposConsentimento from '@/app/components/inicio/OfertaRoseProAposConsentimento';
import { deveMostrarOfertaRosePro } from '@/lib/assinatura/ofertaPosLogin';

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string; entrada?: string }>;
}) {
  const { cadastro, entrada } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfilFuso } = await supabase
    .from('perfis')
    .select('fuso_horario')
    .eq('id', user.id)
    .single();
  const fusoHorario = perfilFuso?.fuso_horario ?? 'America/Sao_Paulo';
  const hoje = hojeISONoFuso(fusoHorario);

  const [{ data: perfil }, { data: checkinHoje }, { data: checkins }, { data: carteira }] = await Promise.all([
    supabase.from('perfis').select('nome, plano').eq('id', user.id).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', user.id).eq('data', hoje).maybeSingle(),
    supabase.from('checkins').select('data').eq('usuaria_id', user.id),
    supabase.from('carteiras_petalas').select('saldo').eq('usuaria_id', user.id).maybeSingle(),
  ]);

  const saldoPetalas = carteira?.saldo ?? 0;

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), hojeNoFuso(fusoHorario));
  const jaFezCheckinHoje = !!checkinHoje;
  const checkinHojeId: string | null = checkinHoje?.id ?? null;

  const jornadaAtiva = await buscarJornadaAtivaParaExibir(supabase, user.id, checkinHojeId);
  const mostrarOfertaRosePro = deveMostrarOfertaRosePro({
    plano: perfil?.plano ?? null,
    entrada,
    cadastro,
  });

  let jornadaEmAndamento: JornadaEmAndamentoInfo | null = null;
  if (jornadaAtiva) {
    const href =
      jaFezCheckinHoje || jornadaAtiva.linkAtividade.tipo === 'indisponivel'
        ? '/jornadas'
        : jornadaAtiva.linkAtividade.href;

    jornadaEmAndamento = {
      titulo: jornadaAtiva.titulo,
      descricao: jornadaAtiva.descricao,
      diasCompletados: jornadaAtiva.diasCompletados,
      duracaoDias: jornadaAtiva.duracaoDias,
      href,
    };
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
      {cadastro === 'concluido' && <TikTokCompleteRegistration />}
      {cadastro === 'concluido' && <MetaCompleteRegistration />}
      {mostrarOfertaRosePro && <OfertaRoseProAposConsentimento />}
      <FundoDecorativo />

      <Saudacao nome={perfil?.nome ?? null} />

      <InstalarRose variante="banner" />

      {jaFezCheckinHoje ? <ResumoDoDia checkinHoje={checkinHoje} /> : <SeletorHumor />}

      <SequenciaDias progresso={progresso} totalCheckins={(checkins ?? []).length} />

      <JornadaEmAndamento jornada={jornadaEmAndamento} />

      <ContinuarDeOndeParei supabase={supabase} usuariaId={user.id} />

      <RitualDeHoje jaFezCheckinHoje={jaFezCheckinHoje} />

      <CartaoClubeRose saldo={saldoPetalas} />

      <MensagemAcolhedora />

      <AvisoSeguranca />

      <NavegacaoInferior />
    </main>
  );
}
