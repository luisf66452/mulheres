import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { calcularProgresso7Dias } from '@/lib/progress/streak';
import { escolherJornadaAtivaMaisRecente, resolverLinkAtividadeDoDia } from '@/lib/jornadas/emAndamento';
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

  const [{ data: perfil }, { data: checkinHoje }, { data: checkins }, { data: jornadasAtivas }] =
    await Promise.all([
      supabase.from('perfis').select('nome').eq('id', user!.id).single(),
      supabase.from('checkins').select('*').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
      supabase.from('checkins').select('data').eq('usuaria_id', user!.id),
      supabase
        .from('jornadas_usuarias')
        .select('id, jornada_id, dias_completados, atualizada_em')
        .eq('usuaria_id', user!.id)
        .eq('status', 'em_andamento'),
    ]);

  const progresso = calcularProgresso7Dias((checkins ?? []).map((c) => c.data), new Date());
  const jaFezCheckinHoje = !!checkinHoje;
  const checkinHojeId: string | null = checkinHoje?.id ?? null;

  const jornadaAtivaMaisRecente = escolherJornadaAtivaMaisRecente(
    (jornadasAtivas ?? []).map((j) => ({
      id: j.id,
      jornadaId: j.jornada_id,
      diasCompletados: j.dias_completados,
      atualizadaEm: j.atualizada_em,
    }))
  );

  let jornadaEmAndamento: JornadaEmAndamentoInfo | null = null;
  if (jornadaAtivaMaisRecente) {
    const [{ data: jornada }, { data: atividadeDoDia }] = await Promise.all([
      supabase
        .from('jornadas')
        .select('titulo, descricao, duracao_dias')
        .eq('id', jornadaAtivaMaisRecente.jornadaId)
        .single(),
      supabase
        .from('jornada_atividades')
        .select('id')
        .eq('jornada_id', jornadaAtivaMaisRecente.jornadaId)
        .eq('numero_dia', jornadaAtivaMaisRecente.diasCompletados + 1)
        .maybeSingle(),
    ]);

    if (jornada) {
      const linkAtividade = resolverLinkAtividadeDoDia(atividadeDoDia?.id ?? null, checkinHojeId);
      const href =
        jaFezCheckinHoje || linkAtividade.tipo === 'indisponivel' ? '/jornadas' : linkAtividade.href;

      jornadaEmAndamento = {
        titulo: jornada.titulo,
        descricao: jornada.descricao,
        diasCompletados: jornadaAtivaMaisRecente.diasCompletados,
        duracaoDias: jornada.duracao_dias,
        href,
      };
    }
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 overflow-hidden p-6 pb-24 md:pb-6">
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
