import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import BarraProgressoPercentual from '@/app/components/jornadas/BarraProgressoPercentual';
import EstadoSessaoIcone from '@/app/components/jornadas/EstadoSessaoIcone';
import { buscarJornadaPorSlug, contarModulos, contarSessoes } from '@/lib/jornadas-conteudo/dados';
import {
  calcularEstadosSessoes,
  calcularPercentualConcluido,
  carregarProgressoJornada,
} from '@/lib/jornadas-conteudo/progresso';
import type { EstadoSessao } from '@/lib/jornadas-conteudo/tipos';

const ROTULO_ESTADO: Record<EstadoSessao, string> = {
  concluida: 'Sessão concluída',
  em_andamento: 'Sessão em andamento',
  disponivel: 'Sessão disponível',
  bloqueada: 'Sessão bloqueada',
};

export default async function JornadaDetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jornada = buscarJornadaPorSlug(slug);

  if (!jornada) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let estados: ReturnType<typeof calcularEstadosSessoes>;
  let percentualConcluido: number;
  try {
    const progresso = await carregarProgressoJornada(supabase, user.id, jornada.slug);
    estados = calcularEstadosSessoes(jornada, progresso);
    percentualConcluido = calcularPercentualConcluido(jornada, estados);
  } catch {
    return (
      <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
        <Link href="/jornadas" className="inline-block text-sm text-texto-suave hover:text-texto">
          ← Jornadas
        </Link>
        <p className="text-sm text-alerta">
          Não foi possível carregar seu progresso nesta jornada agora. Tente novamente em instantes.
        </p>
        <NavegacaoInferior />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <Link href="/jornadas" className="inline-block text-sm text-texto-suave hover:text-texto">
        ← Jornadas
      </Link>

      <div className="space-y-3">
        <div>
          <h1 className="font-display text-2xl text-texto">{jornada.titulo}</h1>
          <p className="mt-1 text-sm text-texto-suave">{jornada.descricaoCurta}</p>
        </div>
        <p className="text-xs text-texto-suave">
          {contarModulos(jornada)} módulos • {contarSessoes(jornada)} sessões
        </p>
        <div className="flex items-center gap-2">
          <BarraProgressoPercentual percentual={percentualConcluido} className="flex-1" />
          <span className="text-xs font-medium text-texto">{percentualConcluido}%</span>
        </div>
      </div>

      <div className="space-y-5">
        {jornada.modulos.map((modulo, indice) => (
          <section key={modulo.id} aria-labelledby={`${modulo.id}-titulo`} className="space-y-2">
            <h2 id={`${modulo.id}-titulo`} className="font-display text-base text-texto">
              Módulo {indice + 1} · {modulo.titulo}
            </h2>
            <ul className="space-y-2">
              {modulo.sessoes.map((sessao) => {
                const estado = estados[sessao.id] ?? 'bloqueada';
                const bloqueada = estado === 'bloqueada';

                const conteudo = (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-texto">{sessao.titulo}</p>
                      <p className="truncate text-xs text-texto-suave">{sessao.descricaoCurta}</p>
                    </div>
                    <span className="shrink-0" role="img" aria-label={ROTULO_ESTADO[estado]}>
                      <EstadoSessaoIcone estado={estado} />
                    </span>
                  </div>
                );

                if (bloqueada) {
                  return (
                    <li key={sessao.id}>
                      <div
                        aria-disabled="true"
                        className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3 opacity-60"
                      >
                        {conteudo}
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={sessao.id}>
                    <Link
                      href={`/jornadas/${jornada.slug}/${sessao.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3 transition-colors duration-150 hover:bg-borda/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
                    >
                      {conteudo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <NavegacaoInferior />
    </main>
  );
}
