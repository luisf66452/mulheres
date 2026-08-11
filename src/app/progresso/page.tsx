import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia } from '@/lib/progress/streak';
import ProgressoBlobs from '@/app/components/ProgressoBlobs';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import MelhorSequencia from './MelhorSequencia';
import GraficoEvolucao from './GraficoEvolucao';
import Historico, { type ItemHistorico } from './Historico';

export default async function ProgressoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkins, error: erroCheckins } = await supabase
    .from('checkins')
    .select('*')
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
  const progresso = calcularProgresso7Dias(todosOsCheckins.map((c) => c.data), new Date());
  const melhorSequencia = calcularMelhorSequencia(todosOsCheckins.map((c) => c.data));
  const checkinsParaGrafico = todosOsCheckins.slice(-30);
  const checkinsRecentes = todosOsCheckins.slice(-20).reverse();

  const checkinIds = checkinsRecentes.map((c) => c.id);

  const sessoesDoHistorico =
    checkinIds.length > 0
      ? ((await supabase.from('sessoes').select('*').eq('usuaria_id', user!.id).in('checkin_id', checkinIds))
          .data ?? [])
      : [];

  const praticaIds = sessoesDoHistorico
    .map((s) => s.pratica_id)
    .filter((id): id is string => id !== null);
  const atividadeIds = sessoesDoHistorico
    .map((s) => s.jornada_atividade_id)
    .filter((id): id is string => id !== null);

  const praticasDoHistorico =
    praticaIds.length > 0
      ? ((await supabase.from('praticas').select('id, titulo').in('id', praticaIds)).data ?? [])
      : [];
  const atividadesDoHistorico =
    atividadeIds.length > 0
      ? ((await supabase.from('jornada_atividades').select('id, titulo').in('id', atividadeIds)).data ?? [])
      : [];

  const tituloPorPratica = new Map(praticasDoHistorico.map((p) => [p.id, p.titulo]));
  const tituloPorAtividade = new Map(atividadesDoHistorico.map((a) => [a.id, a.titulo]));
  const sessaoPorCheckin = new Map(sessoesDoHistorico.map((s) => [s.checkin_id, s]));

  const itensHistorico: ItemHistorico[] = checkinsRecentes.map((checkin) => {
    const sessao = sessaoPorCheckin.get(checkin.id);
    let descricaoRitual: string | null = null;
    if (sessao?.pratica_id) {
      descricaoRitual = tituloPorPratica.get(sessao.pratica_id) ?? null;
    } else if (sessao?.jornada_atividade_id) {
      descricaoRitual = tituloPorAtividade.get(sessao.jornada_atividade_id) ?? null;
    }
    return { checkin, descricaoRitual };
  });

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Seu progresso</h1>

      <p className="text-texto">
        Você completou o ritual em <strong>{progresso.diasCompletos} de 7</strong> dias esta semana.
      </p>

      {progresso.diasConsecutivosAtuais > 0 && (
        <p className="text-texto">
          Você está em uma sequência de {formatarSequencia(progresso.diasConsecutivosAtuais)}. 🌱
        </p>
      )}

      <ProgressoBlobs
        dias={progresso.ultimos7Dias.map((dia) => ({ rotulo: dia.data, completo: dia.completou }))}
      />

      <MelhorSequencia melhorSequencia={melhorSequencia} />

      <p className="text-sm text-texto-suave">
        Este resumo é só um retrato acolhedor da sua semana — ele não tira conclusões sobre o motivo
        dos seus dias serem como foram.
      </p>

      <GraficoEvolucao checkins={checkinsParaGrafico} />

      <Historico itens={itensHistorico} />

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
