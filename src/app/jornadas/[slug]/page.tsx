import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import BarraProgressoPercentual from '@/app/components/jornadas/BarraProgressoPercentual';
import EstadoSessaoIcone from '@/app/components/jornadas/EstadoSessaoIcone';
import {
  buscarJornadaPorSlug,
  contarModulos,
  contarSessoes,
  listarJornadas,
} from '@/lib/jornadas-conteudo/dados';
import type { Sessao } from '@/lib/jornadas-conteudo/tipos';

export function generateStaticParams() {
  return listarJornadas().map((jornada) => ({ slug: jornada.slug }));
}

function estadoDaSessao(sessao: Sessao) {
  if (sessao.concluida) return 'concluida' as const;
  if (sessao.bloqueada) return 'bloqueada' as const;
  return 'disponivel' as const;
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
          <BarraProgressoPercentual percentual={jornada.progressoPercentual} className="flex-1" />
          <span className="text-xs font-medium text-texto">{jornada.progressoPercentual}%</span>
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
                const estado = estadoDaSessao(sessao);
                return (
                  <li key={sessao.id}>
                    <div
                      className={`flex items-center justify-between gap-3 rounded-2xl border border-borda bg-superficie p-3 ${
                        estado === 'bloqueada' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-texto">{sessao.titulo}</p>
                        <p className="truncate text-xs text-texto-suave">{sessao.descricao}</p>
                      </div>
                      <span
                        className="shrink-0"
                        role="img"
                        aria-label={
                          estado === 'concluida'
                            ? 'Sessão concluída'
                            : estado === 'bloqueada'
                              ? 'Sessão bloqueada'
                              : 'Sessão disponível'
                        }
                      >
                        <EstadoSessaoIcone estado={estado} />
                      </span>
                    </div>
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
