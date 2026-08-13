import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
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

export default async function InicioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = formatDateISO(new Date());

  const [{ data: perfil }, { data: checkinHoje }, { data: checkins }] = await Promise.all([
    supabase.from('perfis').select('nome').eq('id', user!.id).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
    supabase.from('checkins').select('data').eq('usuaria_id', user!.id),
  ]);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());
  const jaFezCheckinHoje = !!checkinHoje;
  const checkinHojeId: string | null = checkinHoje?.id ?? null;

  const jornadaAtiva = await buscarJornadaAtivaParaExibir(supabase, user!.id, checkinHojeId);

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
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <FundoDecorativo />

      <Saudacao nome={perfil?.nome ?? null} />

      <ResumoDoDia checkinHoje={checkinHoje} />

      {!jaFezCheckinHoje && <SeletorHumor />}

      <RitualDeHoje jaFezCheckinHoje={jaFezCheckinHoje} />

      <SequenciaDias progresso={progresso} />

      <MensagemAcolhedora />

      <JornadaEmAndamento jornada={jornadaEmAndamento} />

      <NavegacaoInferior />
    </main>
  );
}
