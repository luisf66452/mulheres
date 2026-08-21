'use server';

import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { estaEmPreviewVercel } from '@/lib/supabase/previewOnly';
import { JORNADA_RASCUNHO_ID } from './constantes';

const DURACAO_DIAS_QA = 9;

type ResultadoQA = { erro?: string };

// Toda action de QA passa por aqui primeiro. `estaEmPreviewVercel()` lê
// VERCEL_ENV só no servidor (nunca em código que roda no client) — em
// Production, ou em qualquer ambiente que não seja exatamente um deployment
// de Preview da Vercel, cai em notFound() antes de qualquer leitura ou
// escrita. Em seguida exige sessão válida; sem isso, nenhuma linha é tocada.
// user.id vem sempre da própria sessão (nunca de um parâmetro do client).
async function contextoQA() {
  if (!estaEmPreviewVercel()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { supabase, userId: user.id };
}

async function buscarInscricaoPropria(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data } = await supabase
    .from('jornadas_usuarias')
    .select('id, dias_completados, status')
    .eq('usuaria_id', userId)
    .eq('jornada_id', JORNADA_RASCUNHO_ID)
    .maybeSingle();
  return data;
}

export async function ativarJornadaRascunhoPreview(): Promise<ResultadoQA> {
  const { supabase, userId } = await contextoQA();

  // INSERT em jornadas_usuarias não é bloqueado por RLS com base no status
  // da jornada (só por posse: usuaria_id = auth.uid()) — a usuária real,
  // autenticada normalmente, está apenas se inscrevendo na própria conta.
  const { error } = await supabase.from('jornadas_usuarias').insert({
    usuaria_id: userId,
    jornada_id: JORNADA_RASCUNHO_ID,
  });

  if (error) {
    if (error.code === '23505') {
      // Já existe uma inscrição (unique de jornadas_usuarias) — segue em
      // frente em vez de travar; pode já ter sido ativada antes.
      return {};
    }
    console.error('[ativarJornadaRascunhoPreview] erro ao inscrever:', {
      userId,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível ativar a jornada de teste agora. Tente novamente.' };
  }

  return {};
}

// Liberar o próximo dia e voltar a um dia anterior são a mesma operação com
// sinal oposto: ajustam jornadas_usuarias.dias_completados só da própria
// inscrição na jornada de QA, sempre entre 0 e a duração real da jornada.
async function ajustarDiasQA(delta: 1 | -1): Promise<ResultadoQA> {
  const { supabase, userId } = await contextoQA();

  const inscricao = await buscarInscricaoPropria(supabase, userId);
  if (!inscricao) {
    return { erro: 'Ative a jornada de teste primeiro.' };
  }

  const novoDias = Math.min(Math.max(inscricao.dias_completados + delta, 0), DURACAO_DIAS_QA);

  const { error } = await supabase
    .from('jornadas_usuarias')
    .update({
      dias_completados: novoDias,
      status: novoDias >= DURACAO_DIAS_QA ? 'concluida' : 'em_andamento',
      concluida_em: novoDias >= DURACAO_DIAS_QA ? new Date().toISOString() : null,
    })
    // Dupla trava: filtra pelo id da própria inscrição E confirma de novo
    // que ela pertence à usuária logada — RLS (auth.uid() = usuaria_id)
    // também bloquearia sozinha, isto é defesa em profundidade.
    .eq('id', inscricao.id)
    .eq('usuaria_id', userId);

  if (error) {
    console.error('[ajustarDiasQA] erro ao atualizar progresso:', { userId, code: error.code });
    return { erro: 'Não foi possível ajustar o progresso de teste agora.' };
  }

  return {};
}

export async function liberarProximoDiaQA(): Promise<ResultadoQA> {
  return ajustarDiasQA(1);
}

export async function voltarDiaAnteriorQA(): Promise<ResultadoQA> {
  return ajustarDiasQA(-1);
}

// Reinicia só o progresso desta jornada de teste: zera dias_completados e
// limpa (sem apagar a linha) os rascunhos de resposta dos 9 módulos. Nunca
// toca em `sessoes`, `transacoes_petalas` ou `carteiras_petalas` — o
// histórico de pétalas e as sessões já concluídas continuam intactos, o que
// é exatamente o que garante que refazer um módulo depois de reiniciar não
// concede pétalas de novo (ver ehPrimeiraConclusao em
// src/lib/clube-rose/primeiraConclusao.ts, que consulta `sessoes`).
export async function reiniciarProgressoQA(): Promise<ResultadoQA> {
  const { supabase, userId } = await contextoQA();

  const inscricao = await buscarInscricaoPropria(supabase, userId);
  if (!inscricao) {
    return {};
  }

  const { error: erroInscricao } = await supabase
    .from('jornadas_usuarias')
    .update({ dias_completados: 0, status: 'em_andamento', concluida_em: null })
    .eq('id', inscricao.id)
    .eq('usuaria_id', userId);

  if (erroInscricao) {
    console.error('[reiniciarProgressoQA] erro ao zerar progresso:', { userId, code: erroInscricao.code });
    return { erro: 'Não foi possível reiniciar o progresso de teste agora.' };
  }

  // jornada_atividades com status='rascunho' não é legível pela usuária via
  // RLS normal — só para descobrir QUAIS atividades pertencem à jornada de
  // QA (dado de referência, não dado de outra usuária) usamos a service
  // role, só no servidor, só neste deployment de Preview. O UPDATE das
  // respostas em si continua pela sessão normal da usuária, filtrado por
  // user_id = auth.uid() (RLS), nunca pela service role.
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data: atividades } = await admin
      .from('jornada_atividades')
      .select('id')
      .eq('jornada_id', JORNADA_RASCUNHO_ID);

    const idsAtividades = (atividades ?? []).map((a) => a.id);
    if (idsAtividades.length > 0) {
      const { error: erroRespostas } = await supabase
        .from('jornada_respostas_modulo')
        .update({ respostas: { schemaVersion: 1, valores: {}, finalizadoEm: null }, schema_version: 1 })
        .eq('user_id', userId)
        .in('atividade_id', idsAtividades);

      if (erroRespostas) {
        console.error('[reiniciarProgressoQA] erro ao limpar respostas:', { userId, code: erroRespostas.code });
        return { erro: 'Progresso zerado, mas não foi possível limpar os rascunhos salvos.' };
      }
    }
  }

  return {};
}
