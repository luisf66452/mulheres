'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { preferenciasParaColunas, type NotificacoesPreferencias } from '@/lib/perfil/notificacoesPreferencias';
import { enviarParaSubscricoes } from '@/lib/push/enviar';

export async function salvarPreferenciasNotificacao(
  alteracoes: Partial<NotificacoesPreferencias>
): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const colunas = preferenciasParaColunas(alteracoes);

  const { error } = await supabase
    .from('preferencias_notificacoes')
    .upsert({ usuaria_id: user.id, ...colunas, atualizada_em: new Date().toISOString() });

  if (error) {
    console.error('[salvarPreferenciasNotificacao] erro:', error);
    return { erro: 'Não foi possível salvar sua preferência agora.' };
  }

  return {};
}

/** "Pausar por 7 dias" — suspende TODOS os lembretes até a data informada (fuso da usuária). */
export async function pausarNotificacoes(diasCorridos: number): Promise<{ erro?: string; pausadaAte?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const dataLimite = new Date(Date.now() + diasCorridos * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { error } = await supabase
    .from('preferencias_notificacoes')
    .upsert({ usuaria_id: user.id, pausada_ate: dataLimite, atualizada_em: new Date().toISOString() });

  if (error) {
    return { erro: 'Não foi possível pausar as notificações agora.' };
  }

  return { pausadaAte: dataLimite };
}

export async function reativarNotificacoes(): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const { error } = await supabase
    .from('preferencias_notificacoes')
    .upsert({ usuaria_id: user.id, pausada_ate: null, atualizada_em: new Date().toISOString() });

  if (error) {
    return { erro: 'Não foi possível reativar as notificações agora.' };
  }

  return {};
}

/** Lista os dispositivos (inscrições push) da usuária, para a tela de configurações. */
export async function listarDispositivos(): Promise<
  { id: string; userAgent: string | null; criadoEm: string }[]
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('push_subscriptions')
    .select('id, user_agent, criado_em')
    .eq('usuaria_id', user.id)
    .order('criado_em', { ascending: false });

  return (data ?? []).map((d) => ({ id: d.id, userAgent: d.user_agent, criadoEm: d.criado_em }));
}

export async function removerDispositivo(id: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const { error } = await supabase.from('push_subscriptions').delete().eq('id', id).eq('usuaria_id', user.id);
  if (error) {
    return { erro: 'Não foi possível remover este dispositivo agora.' };
  }

  return {};
}

/**
 * Notificação de teste: dispara imediatamente para todos os dispositivos da
 * própria usuária, sem passar pela fila/limites de frequência (é uma ação
 * explícita dela, não um lembrete automático) — mas ainda registra em
 * push_envios (tipo 'teste', já previsto na constraint da tabela) pra deixar
 * rastro mínimo do envio.
 */
export async function enviarNotificacaoTeste(): Promise<{ erro?: string; enviados?: number }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return { erro: 'Notificações push ainda não estão configuradas neste ambiente.' };
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('usuaria_id', user.id);

  if (!subs || subs.length === 0) {
    return { erro: 'Ative as notificações neste dispositivo antes de enviar um teste.' };
  }

  const { enviados } = await enviarParaSubscricoes(supabaseAdmin, subs, {
    title: 'Rose',
    body: 'Esta é uma notificação de teste — se você a recebeu, está tudo funcionando 🌹',
    url: '/perfil/notificacoes',
    tag: 'rose-teste',
  });

  await supabaseAdmin
    .from('push_envios')
    .insert({ usuaria_id: user.id, tipo: 'teste', data_local: new Date().toISOString().slice(0, 10) });

  if (enviados === 0) {
    return { erro: 'Não foi possível entregar a notificação de teste agora.' };
  }

  return { enviados };
}
