// Lógica de progresso real das 83 sessões (persistida em
// sessoes_jornadas_conteudo_progresso, migração 0028). `calcularEstadosSessoes`
// é pura e testável isoladamente; as funções de I/O ficam separadas para
// não misturar lógica de decisão com chamadas ao Supabase.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { EstadoSessao } from './tipos';

/**
 * Calcula o estado de cada sessão, na ordem em que aparecem no módulo/jornada
 * (`sessaoIdsEmOrdem`). Regra: a primeira sessão de uma jornada está sempre
 * disponível; uma sessão só fica disponível depois que a anterior é
 * concluída; uma sessão "iniciada mas não concluída" fica em_andamento e
 * ainda bloqueia a próxima (evita pular etapas mesmo abrindo e saindo sem
 * terminar).
 */
export function calcularEstadosSessoes(
  sessaoIdsEmOrdem: string[],
  concluidas: ReadonlySet<string>,
  iniciadas: ReadonlySet<string>
): Record<string, EstadoSessao> {
  const estados: Record<string, EstadoSessao> = {};
  let anteriorLiberouProxima = true;

  for (const id of sessaoIdsEmOrdem) {
    if (concluidas.has(id)) {
      estados[id] = 'concluida';
      anteriorLiberouProxima = true;
      continue;
    }

    if (!anteriorLiberouProxima) {
      estados[id] = 'bloqueada';
      continue;
    }

    estados[id] = iniciadas.has(id) ? 'em_andamento' : 'disponivel';
    anteriorLiberouProxima = false;
  }

  return estados;
}

/** Percentual de sessões concluídas — nunca ultrapassa 100, mesmo com dados inconsistentes. */
export function calcularPercentualConcluido(concluidas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((concluidas / total) * 100));
}

export interface ProgressoJornadaCarregado {
  concluidas: Set<string>;
  iniciadas: Set<string>;
}

export async function carregarProgressoJornada(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string
): Promise<ProgressoJornadaCarregado> {
  const { data } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .select('sessao_id, concluida_em')
    .eq('usuaria_id', usuariaId)
    .eq('jornada_slug', jornadaSlug);

  const concluidas = new Set<string>();
  const iniciadas = new Set<string>();

  for (const linha of data ?? []) {
    if (linha.concluida_em) {
      concluidas.add(linha.sessao_id);
    } else {
      iniciadas.add(linha.sessao_id);
    }
  }

  return { concluidas, iniciadas };
}

/** Quantidade de sessões concluídas por jornada, para TODAS as jornadas de uma vez (tela de listagem) — evita uma query por jornada. */
export async function contarConcluidasPorJornada(
  supabase: SupabaseClient<Database>,
  usuariaId: string
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .select('jornada_slug')
    .eq('usuaria_id', usuariaId)
    .not('concluida_em', 'is', null);

  const contagem = new Map<string, number>();
  for (const linha of data ?? []) {
    contagem.set(linha.jornada_slug, (contagem.get(linha.jornada_slug) ?? 0) + 1);
  }
  return contagem;
}

export async function registrarInicioSessao(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string,
  sessaoId: string
): Promise<void> {
  // ignoreDuplicates: abrir a mesma sessão de novo não deve resetar
  // iniciada_em nem sobrescrever concluida_em já gravada.
  await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .upsert(
      { usuaria_id: usuariaId, jornada_slug: jornadaSlug, sessao_id: sessaoId },
      { onConflict: 'usuaria_id,sessao_id', ignoreDuplicates: true }
    );
}

export interface ResultadoConclusaoSessao {
  /** true só quando ESTA chamada foi quem marcou concluida_em pela primeira vez — usado para conceder Pétalas sem duplicar. */
  concluidaAgora: boolean;
}

export async function registrarConclusaoSessao(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string,
  sessaoId: string
): Promise<ResultadoConclusaoSessao> {
  await registrarInicioSessao(supabase, usuariaId, jornadaSlug, sessaoId);

  // UPDATE condicional (`is('concluida_em', null)`): sob duas requisições
  // concorrentes para a mesma sessão, o Postgres serializa os UPDATEs na
  // mesma linha — só a primeira encontra concluida_em nula e afeta a linha;
  // a segunda não encontra nenhuma linha correspondente (já não é mais
  // nula) e recebe `data` vazio. Isso é o que garante idempotência real,
  // não uma checagem de aplicação que poderia perder uma corrida.
  const { data, error } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .update({ concluida_em: new Date().toISOString() })
    .eq('usuaria_id', usuariaId)
    .eq('sessao_id', sessaoId)
    .is('concluida_em', null)
    .select('id');

  if (error) {
    throw new Error('Não foi possível registrar a conclusão da sessão.');
  }

  return { concluidaAgora: (data?.length ?? 0) > 0 };
}
