import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia } from '@/lib/progress/streak';
import {
  resolverSegundaFeira,
  calcularSemana,
  semanaAnteriorISO,
  semanaSeguinteISO,
} from '@/lib/progress/semana';
import { formatDateISO } from '@/lib/date';
import { resolverItensHistorico } from '@/lib/historico/resolverItens';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoProgresso from './CabecalhoProgresso';
import CartaoSequencia from './CartaoSequencia';
import HumorSemana from './HumorSemana';
import CartaoConquistas from './CartaoConquistas';
import MelhorSequencia from './MelhorSequencia';
import GraficoEvolucao from './GraficoEvolucao';
import Historico from './Historico';

export default async function ProgressoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('id, data, humor, imagem_corporal, comida')
    .eq('usuaria_id', user!.id)
    .order('data', { ascending: true });

  if (erroCheckins) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
        <h1 className="font-display text-2xl text-texto">Seu progresso</h1>
        <p className="text-sm text-alerta">
          Não foi possível carregar seus dados agora. Tente novamente em instantes.
        </p>
        <NavegacaoInferior />
      </main>
    );
  }

  const todosOsCheckins = checkins ?? [];
  const hoje = new Date();
  const progresso = calcularProgresso7Dias(todosOsCheckins.map((c) => c.data), hoje);
  const melhorSequencia = calcularMelhorSequencia(todosOsCheckins.map((c) => c.data));

  const segundaFeiraISO = resolverSegundaFeira(semana, hoje);
  const diasDaSemana = calcularSemana(
    todosOsCheckins.map((c) => ({ data: c.data, humor: c.humor })),
    segundaFeiraISO
  );

  const { count: totalPraticasCuradas } = await supabase
    .from('sessoes')
    .select('id', { count: 'exact', head: true })
    .eq('usuaria_id', user!.id)
    .not('pratica_id', 'is', null);

  const checkinsParaGrafico = todosOsCheckins.slice(-30);
  const checkinsRecentes = todosOsCheckins.slice(-20).reverse();
  const checkinIds = checkinsRecentes.map((c) => c.id);

  const { data: sessoesDoHistorico, error: erroSessoes } =
    checkinIds.length > 0
      ? await supabase.from('sessoes').select('*').eq('usuaria_id', user!.id).in('checkin_id', checkinIds)
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
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
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
        usuariaId={user!.id}
        melhorSequencia={melhorSequencia}
        totalCheckins={todosOsCheckins.length}
        totalPraticasCuradas={totalPraticasCuradas ?? 0}
      />

      <MelhorSequencia melhorSequencia={melhorSequencia} />

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
  );
}
