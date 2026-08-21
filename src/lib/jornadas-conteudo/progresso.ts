// Lógica de progresso real das 83 sessões (persistida em
// sessoes_jornadas_conteudo_progresso, migração 20260818220822).
// `calcularEstadosSessoes` e `calcularPercentualConcluido` são puras e
// testáveis isoladamente; as funções de I/O ficam separadas para não
// misturar lógica de decisão com chamadas ao Supabase.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { EstadoSessao, Jornada } from './tipos';
import { listarSessoesEmOrdem } from './dados';

export interface ProgressoSessao {
  iniciadaEm: string;
  concluidaEm: string | null;
}

/**
 * Carrega, de uma vez, o progresso de todas as sessões de uma jornada que a
 * usuária já tocou (iniciou e/ou concluiu). Sessões sem linha na tabela
 * simplesmente não aparecem no resultado.
 *
 * Lança em caso de falha de leitura (token expirado, instabilidade de rede,
 * mudança de RLS) em vez de devolver silenciosamente `{}` — um `{}` seria
 * indistinguível de "zero progresso de verdade" para quem chama, fazendo uma
 * usuária com sessões concluídas parecer resetada. As páginas que chamam
 * esta função devem capturar o erro e mostrar um estado de erro real.
 */
export async function carregarProgressoJornada(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string
): Promise<Record<string, ProgressoSessao>> {
  const { data, error } = await supabase
    .from('sessoes_jornadas_conteudo_progresso')
    .select('sessao_id, iniciada_em, concluida_em')
    .eq('usuaria_id', usuariaId)
    .eq('jornada_slug', jornadaSlug);

  if (error) {
    // Nunca logar conteúdo psicoeducativo/reflexão nem dados que
    // identifiquem a usuária — só o fato de que a leitura falhou e o código
    // do erro do Postgres.
    console.error('Falha ao carregar progresso de jornada:', error.code, error.message);
    throw new Error('Não foi possível carregar o progresso da jornada.');
  }

  const progresso: Record<string, ProgressoSessao> = {};
  for (const linha of data ?? []) {
    progresso[linha.sessao_id] = {
      iniciadaEm: linha.iniciada_em,
      concluidaEm: linha.concluida_em,
    };
  }
  return progresso;
}

/**
 * Calcula o estado de cada sessão da jornada, na ordem em que aparecem
 * (módulo → sessão). Regra: a primeira sessão de uma jornada nunca fica
 * bloqueada; uma sessão só fica disponível depois que TODAS as anteriores
 * estão concluídas; uma sessão iniciada mas não concluída fica
 * em_andamento e ainda bloqueia a próxima (evita pular etapas mesmo abrindo
 * e saindo sem terminar).
 */
export function calcularEstadosSessoes(
  jornada: Jornada,
  progresso: Record<string, { concluidaEm: string | null }>
): Record<string, EstadoSessao> {
  const estados: Record<string, EstadoSessao> = {};
  let todasAnterioresConcluidas = true;

  for (const sessao of listarSessoesEmOrdem(jornada)) {
    const linha = progresso[sessao.id];

    if (linha?.concluidaEm) {
      estados[sessao.id] = 'concluida';
      continue;
    }

    if (!todasAnterioresConcluidas) {
      estados[sessao.id] = 'bloqueada';
      continue;
    }

    estados[sessao.id] = linha ? 'em_andamento' : 'disponivel';
    todasAnterioresConcluidas = false;
  }

  return estados;
}

/** Percentual de sessões concluídas — nunca ultrapassa 100, mesmo com dados inconsistentes. */
export function calcularPercentualConcluido(
  jornada: Jornada,
  estados: Record<string, EstadoSessao>
): number {
  const total = listarSessoesEmOrdem(jornada).length;
  if (total <= 0) return 0;

  const concluidas = Object.values(estados).filter((estado) => estado === 'concluida').length;
  return Math.min(100, Math.round((concluidas / total) * 100));
}

/**
 * Marca que a usuária abriu a sessão. Idempotente: se já existir uma linha
 * (iniciada e/ou concluída), este upsert não a toca — nunca sobrescreve
 * `concluida_em` nem reseta `iniciada_em`.
 */
export async function registrarInicioSessao(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string,
  sessaoId: string
): Promise<void> {
  await supabase.from('sessoes_jornadas_conteudo_progresso').upsert(
    { usuaria_id: usuariaId, jornada_slug: jornadaSlug, sessao_id: sessaoId },
    { onConflict: 'usuaria_id,sessao_id', ignoreDuplicates: true }
  );
}

export interface ResultadoConclusaoSessao {
  /** true só quando ESTA chamada foi quem marcou concluida_em pela primeira vez — usado para conceder Pétalas sem duplicar. */
  concluidaAgora: boolean;
}

/**
 * Marca a sessão como concluída. A idempotência não depende de uma checagem
 * de aplicação (que poderia perder uma corrida sob requisições
 * concorrentes) — depende do UPDATE condicional abaixo
 * (`concluida_em is null`): sob duas requisições concorrentes para a mesma
 * sessão, o Postgres serializa os UPDATEs na mesma linha; só a primeira
 * encontra concluida_em nula e afeta a linha, a segunda não afeta nenhuma
 * (data vazio). `concluidaAgora` reflete exatamente isso.
 */
export async function registrarConclusaoSessao(
  supabase: SupabaseClient<Database>,
  usuariaId: string,
  jornadaSlug: string,
  sessaoId: string
): Promise<ResultadoConclusaoSessao> {
  await registrarInicioSessao(supabase, usuariaId, jornadaSlug, sessaoId);

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
