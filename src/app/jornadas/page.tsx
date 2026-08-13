import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDateISO } from '@/lib/date';
import { buscarJornadaAtivaParaExibir } from '@/lib/jornadas/buscarJornadaAtivaParaExibir';
import { calcularModuloSessao, calcularDiaExibido } from '@/lib/jornadas/moduloSessao';
import { atribuirIlustracoes } from '@/lib/jornadas/ilustracoes';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import SuaJornadaAtual, { type SuaJornadaAtualProps } from '@/app/components/jornadas/SuaJornadaAtual';
import CardJornadaExplorar, {
  type CardJornadaExplorarInfo,
} from '@/app/components/jornadas/CardJornadaExplorar';

export default async function JornadasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = formatDateISO(new Date());

  const [{ data: checkinHoje }, { data: jornadas }, { data: progressos }] = await Promise.all([
    supabase.from('checkins').select('id').eq('usuaria_id', user!.id).eq('data', hoje).maybeSingle(),
    supabase.from('jornadas').select('*').eq('status', 'publicada').order('criado_em'),
    supabase.from('jornadas_usuarias').select('*').eq('usuaria_id', user!.id),
  ]);

  const checkinHojeId: string | null = checkinHoje?.id ?? null;
  const todasJornadas = jornadas ?? [];
  const progressoPorJornada = new Map((progressos ?? []).map((p) => [p.jornada_id, p]));

  const jornadaAtiva = await buscarJornadaAtivaParaExibir(supabase, user!.id, checkinHojeId);

  let jornadaDestaqueId: string | null = null;
  let tipoHero: 'ativa' | 'recomendada' | 'conquista' | 'vazia';

  if (jornadaAtiva) {
    jornadaDestaqueId = jornadaAtiva.jornadaId;
    tipoHero = 'ativa';
  } else {
    const naoConcluida = todasJornadas.find(
      (j) => progressoPorJornada.get(j.id)?.status !== 'concluida'
    );
    if (naoConcluida) {
      jornadaDestaqueId = naoConcluida.id;
      tipoHero = 'recomendada';
    } else if (todasJornadas.length > 0) {
      jornadaDestaqueId = todasJornadas[0].id;
      tipoHero = 'conquista';
    } else {
      tipoHero = 'vazia';
    }
  }

  const jornadasExplorar = todasJornadas.filter((j) => j.id !== jornadaDestaqueId);
  const idsNaOrdemDeExibicao = [
    ...(jornadaDestaqueId ? [jornadaDestaqueId] : []),
    ...jornadasExplorar.map((j) => j.id),
  ];
  const ilustracoes = atribuirIlustracoes(idsNaOrdemDeExibicao);
  const ilustracaoIndice = (id: string) => ilustracoes.get(id) ?? 0;

  let heroProps: SuaJornadaAtualProps;

  if (tipoHero === 'ativa' && jornadaAtiva) {
    const diaExibido = jornadaAtiva.emRevisao
      ? 1
      : calcularDiaExibido(jornadaAtiva.diasCompletados, jornadaAtiva.duracaoDias);
    const { modulo, sessao } = calcularModuloSessao(diaExibido);
    heroProps = {
      tipo: 'ativa',
      ilustracaoIndice: ilustracaoIndice(jornadaAtiva.jornadaId),
      titulo: jornadaAtiva.titulo,
      modulo,
      sessao,
      diasCompletados: jornadaAtiva.diasCompletados,
      duracaoDias: jornadaAtiva.duracaoDias,
      emRevisao: jornadaAtiva.emRevisao,
      linkAtividade: jornadaAtiva.linkAtividade,
    };
  } else if (tipoHero === 'recomendada' && jornadaDestaqueId) {
    const destaque = todasJornadas.find((j) => j.id === jornadaDestaqueId)!;
    heroProps = {
      tipo: 'recomendada',
      ilustracaoIndice: ilustracaoIndice(destaque.id),
      jornadaId: destaque.id,
      titulo: destaque.titulo,
      descricao: destaque.descricao,
    };
  } else if (tipoHero === 'conquista' && jornadaDestaqueId) {
    heroProps = {
      tipo: 'conquista',
      ilustracaoIndice: ilustracaoIndice(jornadaDestaqueId),
      jornadaId: jornadaDestaqueId,
    };
  } else {
    heroProps = { tipo: 'vazia' };
  }

  const cardsExplorar: CardJornadaExplorarInfo[] = jornadasExplorar.map((jornada) => {
    const progresso = progressoPorJornada.get(jornada.id);
    const label =
      progresso?.status === 'concluida'
        ? 'Revisitar jornada'
        : progresso?.status === 'pausada'
          ? 'Retomar'
          : 'Começar';

    return {
      jornadaId: jornada.id,
      ilustracaoIndice: ilustracaoIndice(jornada.id),
      titulo: jornada.titulo,
      descricao: jornada.descricao,
      duracaoDias: jornada.duracao_dias,
      quantidadeModulos: calcularModuloSessao(jornada.duracao_dias).modulo,
      label,
    };
  });

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-6">
      <h1 className="font-display text-2xl text-texto">Jornadas</h1>

      <SuaJornadaAtual {...heroProps} />

      {cardsExplorar.length > 0 && (
        <div className="space-y-3">
          <p className="font-display text-lg text-texto">Explorar jornadas</p>
          <div className="space-y-3">
            {cardsExplorar.map((jornada) => (
              <CardJornadaExplorar key={jornada.jornadaId} jornada={jornada} />
            ))}
          </div>
        </div>
      )}

      <NavegacaoInferior />
    </main>
  );
}
