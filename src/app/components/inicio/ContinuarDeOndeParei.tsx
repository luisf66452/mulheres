import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import Cartao from '@/app/components/Cartao';
import {
  buscarLinhasProgressoTodasJornadas,
  resolverProximaAcaoJornada,
} from '@/lib/jornadas-conteudo/continuarDeOndeParei';
import { buscarJornadaPorSlug, buscarSessaoPorId, listarJornadas } from '@/lib/jornadas-conteudo/dados';
import ContinuarPraticaLocalClient from './ContinuarPraticaLocalClient';

export default async function ContinuarDeOndeParei({
  supabase,
  usuariaId,
}: {
  supabase: SupabaseClient<Database>;
  usuariaId: string;
}) {
  let linhas: Awaited<ReturnType<typeof buscarLinhasProgressoTodasJornadas>> = [];
  try {
    linhas = await buscarLinhasProgressoTodasJornadas(supabase, usuariaId);
  } catch {
    // Card opcional da Home — uma falha ao ler progresso de jornadas nunca
    // deve quebrar a página inteira. Cai para a Prioridade 3 (local).
    return <ContinuarPraticaLocalClient usuariaId={usuariaId} />;
  }

  const acao = resolverProximaAcaoJornada(listarJornadas(), linhas);

  if (acao) {
    const jornada = buscarJornadaPorSlug(acao.jornadaSlug);
    const resultado = buscarSessaoPorId(acao.jornadaSlug, acao.sessaoId);

    if (jornada && resultado) {
      return (
        <div className="space-y-3">
          <p className="font-display text-lg text-texto">Continue de onde parou</p>
          <Link href={`/jornadas/${jornada.slug}/${acao.sessaoId}`} className="block">
            <Cartao className="space-y-1 transition-colors hover:bg-fundo">
              <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">{jornada.titulo}</p>
              <p className="font-display text-base text-texto">{resultado.sessao.titulo}</p>
              <p className="line-clamp-2 text-sm text-texto-suave">{resultado.sessao.descricaoCurta}</p>
            </Cartao>
          </Link>
        </div>
      );
    }
  }

  return <ContinuarPraticaLocalClient usuariaId={usuariaId} />;
}
