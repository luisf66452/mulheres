import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia } from '@/lib/progress/streak';
import {
  resolverSegundaFeira,
  calcularSemana,
  semanaAnteriorISO,
  semanaSeguinteISO,
} from '@/lib/progress/semana';
import { calcularResumoSemanal, type CheckinResumoSemanal } from '@/lib/progress/resumoSemanal';
import { formatDateISO, hojeNoFuso, dataISONoFuso } from '@/lib/date';
import { resolverItensHistorico } from '@/lib/historico/resolverItens';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoProgresso from './CabecalhoProgresso';
import CartaoSequencia from './CartaoSequencia';
import HumorSemana from './HumorSemana';
import CartaoConquistas from './CartaoConquistas';
import MelhorSequencia from './MelhorSequencia';
import ResumoSemanalPessoal from './ResumoSemanalPessoal';
import GraficoEvolucao from './GraficoEvolucao';
import Historico from './Historico';
import NotificacaoPetalas from '@/app/components/clube-rose/NotificacaoPetalas';
import NotificacaoLimitePetalas from '@/app/components/clube-rose/NotificacaoLimitePetalas';

export default async function ProgressoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; petalas?: string; limitePetalas?: string }>;
}) {
  const { semana, petalas, limitePetalas } = await searchParams;
  const petalasGanhas = petalas ? Number.parseInt(petalas, 10) : 0;
  const mostrarLimiteAtingido = limitePetalas === '1';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('fuso_horario, plano')
    .eq('id', user.id)
    .single();
  const fusoHorario = perfil?.fuso_horario ?? 'America/Sao_Paulo';
  const ehPremium = perfil?.plano === 'premium';

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('id, data, humor, imagem_corporal, comida, estado_geral, emocao_especifica, fatores')
    .eq('usuaria_id', user.id)
    .order('data', { ascending: true });

  if (erroCheckins) {
    return (
      <>
        {mostrarLimiteAtingido ? (
          <NotificacaoLimitePetalas />
        ) : (
          petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />
        )}
        <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
          <h1 className="font-display text-2xl text-texto">Seu progresso</h1>
          <p className="text-sm text-alerta">
            Não foi possível carregar seus dados agora. Tente novamente em instantes.
          </p>
          <NavegacaoInferior />
        </main>
      </>
    );
  }

  const todosOsCheckins = checkins ?? [];
  const hoje = hojeNoFuso(fusoHorario);
  const progresso = calcularProgresso7Dias(todosOsCheckins.map((c) => c.data), hoje);
  const melhorSequencia = calcularMelhorSequencia(todosOsCheckins.map((c) => c.data));

  const segundaFeiraISO = resolverSegundaFeira(semana, hoje);
  const diasDaSemana = calcularSemana(
    todosOsCheckins.map((c) => ({ data: c.data, humor: c.humor })),
    segundaFeiraISO
  );

  const diasDaSemanaAtualISO = diasDaSemana.map((d) => d.data);
  const diasDaSemanaAnteriorISO = calcularSemana([], semanaAnteriorISO(segundaFeiraISO)).map((d) => d.data);

  const paraCheckinResumoSemanal = (c: (typeof todosOsCheckins)[number]): CheckinResumoSemanal => ({
    data: c.data,
    humor: c.humor,
    imagem_corporal: c.imagem_corporal,
    comida: c.comida,
    estado_geral: c.estado_geral,
    emocao_especifica: c.emocao_especifica,
    fatores: c.fatores,
  });

  const checkinsSemana = todosOsCheckins
    .filter((c) => diasDaSemanaAtualISO.includes(c.data))
    .map(paraCheckinResumoSemanal);
  const checkinsSemanaAnterior = todosOsCheckins
    .filter((c) => diasDaSemanaAnteriorISO.includes(c.data))
    .map(paraCheckinResumoSemanal);

  const [{ count: totalPraticasCuradas }, { count: totalPraticasRapidas }] = await Promise.all([
    supabase
      .from('sessoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuaria_id', user.id)
      .not('pratica_id', 'is', null),
    supabase
      .from('conclusoes_praticas_conteudo')
      .select('id', { count: 'exact', head: true })
      .eq('usuaria_id', user.id),
  ]);

  const [{ data: sessoesComPratica }, { data: praticasRapidasConcluidas }] = await Promise.all([
    supabase
      .from('sessoes')
      .select('criado_em')
      .eq('usuaria_id', user.id)
      .not('pratica_id', 'is', null),
    supabase.from('conclusoes_praticas_conteudo').select('concluida_em').eq('usuaria_id', user.id),
  ]);

  const datasAtividadesConcluidas = [
    ...(sessoesComPratica ?? []).map((s) => dataISONoFuso(new Date(s.criado_em), fusoHorario)),
    ...(praticasRapidasConcluidas ?? []).map((p) => dataISONoFuso(new Date(p.concluida_em), fusoHorario)),
  ];

  const resumoSemanal = calcularResumoSemanal({
    checkinsSemana,
    checkinsSemanaAnterior,
    diasDaSemana: diasDaSemanaAtualISO,
    datasAtividadesConcluidas,
  });

  const checkinsParaGrafico = todosOsCheckins.slice(-30);
  const checkinsRecentes = todosOsCheckins.slice(-20).reverse();
  const checkinIds = checkinsRecentes.map((c) => c.id);

  const { data: sessoesDoHistorico, error: erroSessoes } =
    checkinIds.length > 0
      ? await supabase.from('sessoes').select('*').eq('usuaria_id', user.id).in('checkin_id', checkinIds)
      : { data: [], error: null };

  const praticaIds = (sessoesDoHistorico ?? [])
    .map((s) => s.pratica_id)
    .filter((id): id is string => id !== null);
  const atividadeIds = (sessoesDoHistorico ?? [])
    .map((s) => s.jornada_atividade_id)
    .filter((id): id is string => id !== null);

  const [praticasResultado, atividadesResultado] = await Promise.all([
    praticaIds.length > 0
      ? supabase.from('praticas').select('id, titulo').in('id', praticaIds)
      : Promise.resolve({ data: [] as { id: string; titulo: string }[], error: null }),
    atividadeIds.length > 0
      ? supabase.from('jornada_atividades').select('id, titulo').in('id', atividadeIds)
      : Promise.resolve({ data: [] as { id: string; titulo: string }[], error: null }),
  ]);

  const erroHistorico = Boolean(erroSessoes || praticasResultado.error || atividadesResultado.error);

  const tituloPorPratica = new Map((praticasResultado.data ?? []).map((p) => [p.id, p.titulo]));
  const tituloPorAtividade = new Map((atividadesResultado.data ?? []).map((a) => [a.id, a.titulo]));
  const itensHistorico = resolverItensHistorico(
    checkinsRecentes,
    sessoesDoHistorico ?? [],
    tituloPorPratica,
    tituloPorAtividade
  );

  return (
    <>
      {mostrarLimiteAtingido ? (
        <NotificacaoLimitePetalas />
      ) : (
        petalasGanhas > 0 && <NotificacaoPetalas quantidade={petalasGanhas} />
      )}
      <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
        <CabecalhoProgresso />

        <CartaoSequencia
          diasConsecutivosAtuais={progresso.diasConsecutivosAtuais}
          totalCheckins={todosOsCheckins.length}
          ultimos7Dias={progresso.ultimos7Dias}
        />

        <HumorSemana
          dias={diasDaSemana}
          hojeISO={formatDateISO(hoje)}
          hrefSemanaAnterior={semanaAnteriorISO(segundaFeiraISO)}
          hrefSemanaSeguinte={semanaSeguinteISO(segundaFeiraISO, hoje)}
        />

        <CartaoConquistas
          usuariaId={user.id}
          melhorSequencia={melhorSequencia}
          totalCheckins={todosOsCheckins.length}
          totalPraticasCuradas={totalPraticasCuradas ?? 0}
          totalPraticasRapidas={totalPraticasRapidas ?? 0}
        />

        <MelhorSequencia melhorSequencia={melhorSequencia} totalCheckins={todosOsCheckins.length} />

        <ResumoSemanalPessoal resumo={resumoSemanal} ehPremium={ehPremium} />

        <p className="text-sm text-texto-suave">
          Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
          dos seus dias serem como foram.
        </p>

        <GraficoEvolucao checkins={checkinsParaGrafico} />

        {erroHistorico ? (
          <p className="text-sm text-alerta">
            Não foi possível carregar o que você fez nesses dias. Tente novamente em instantes.
          </p>
        ) : (
          <Historico itens={itensHistorico} />
        )}

        <a
          href="/checkin"
          className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Voltar ao início
        </a>
        <NavegacaoInferior />
      </main>
    </>
  );
}
