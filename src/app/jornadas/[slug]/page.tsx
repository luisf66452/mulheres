import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import BarraProgressoPercentual from '@/app/components/jornadas/BarraProgressoPercentual';
import EstadoSessaoIcone from '@/app/components/jornadas/EstadoSessaoIcone';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  buscarJornadaPorSlug,
  contarModulos,
  contarSessoes,
  listarJornadas,
  listarSessoesEmOrdem,
} from '@/lib/jornadas-conteudo/dados';
import {
  calcularEstadosSessoes,
  calcularPercentualConcluido,
  carregarProgressoJornada,
} from '@/lib/jornadas-conteudo/progresso';

export function generateStaticParams() {
  return listarJornadas().map((jornada) => ({ slug: jornada.slug }));
}

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

  const { concluidas, iniciadas } = await carregarProgressoJornada(supabase, user.id, jornada.slug);
  const sessaoIdsEmOrdem = listarSessoesEmOrdem(jornada).map((sessao) => sessao.id);
  const estados = calcularEstadosSessoes(sessaoIdsEmOrdem, concluidas, iniciadas);
  const totalSessoes = contarSessoes(jornada);
  const percentual = calcularPercentualConcluido(concluidas.size, totalSessoes);

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
          {contarModulos(jornada)} módulos • {totalSessoes} sessões
        </p>
        <div className="flex items-center gap-2">
          <BarraProgressoPercentual percentual={percentual} className="flex-1" />
          <span className="text-xs font-medium text-texto">{percentual}%</span>
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
                  <div
                    className={`flex items-center justify-between gap-3 rounded-2xl border border-borda bg-superficie p-3 ${
                      bloqueada ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-texto">{sessao.titulo}</p>
                      <p className="line-clamp-2 text-xs text-texto-suave">{sessao.descricaoCurta}</p>
                    </div>
                    <span
                      className="shrink-0"
                      role="img"
                      aria-label={
                        estado === 'concluida'
                          ? 'Sessão concluída'
                          : estado === 'bloqueada'
                            ? 'Sessão bloqueada'
                            : estado === 'em_andamento'
                              ? 'Sessão em andamento'
                              : 'Sessão disponível'
                      }
                    >
                      <EstadoSessaoIcone estado={estado} />
                    </span>
                  </div>
                );

                return (
                  <li key={sessao.id}>
                    {bloqueada ? (
                      conteudo
                    ) : (
                      <Link
                        href={`/jornadas/${jornada.slug}/${sessao.id}`}
                        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
                      >
                        {conteudo}
                      </Link>
                    )}
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
