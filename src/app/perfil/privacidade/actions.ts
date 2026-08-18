'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Só os campos com sentido para a própria usuária ver de novo no export.
// De propósito fora: role (papel interno), stripe_customer_id e
// stripe_subscription_id (identificadores internos de cobrança, não
// segredos, mas sem utilidade para a usuária e fora do escopo do que ela
// preencheu/gerou diretamente).
function perfilExportavel(perfil: Record<string, unknown> | null) {
  if (!perfil) return null;
  return {
    nome: perfil.nome,
    plano: perfil.plano,
    pais: perfil.pais,
    frase_pessoal: perfil.frase_pessoal,
    faixa_etaria: perfil.faixa_etaria,
    fuso_horario: perfil.fuso_horario,
    idioma: perfil.idioma,
    foto_url: perfil.foto_url,
    horario_preferido_notificacao: perfil.horario_preferido_notificacao,
    assinatura_status: perfil.assinatura_status,
    assinatura_periodo_fim: perfil.assinatura_periodo_fim,
    criado_em: perfil.criado_em,
  };
}

export async function exportarMeusDados(): Promise<{ erro?: string; dados?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const usuariaId = user.id;

  const [
    { data: perfil, error: erroPerfil },
    { data: checkins, error: erroCheckins },
    { data: sessoes, error: erroSessoes },
    { data: jornadasUsuarias, error: erroJornadasUsuarias },
    { data: conclusoesPraticas, error: erroConclusoes },
    { data: carteira, error: erroCarteira },
    { data: transacoesPetalas, error: erroTransacoes },
    { data: resgatesDesafio, error: erroResgatesDesafio },
    { data: resgatesRecompensas, error: erroResgatesRecompensas },
    { data: preferenciasNotificacoes, error: erroPreferencias },
    { data: intencaoPagamento, error: erroIntencao },
  ] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', usuariaId).single(),
    supabase.from('checkins').select('*').eq('usuaria_id', usuariaId),
    supabase.from('sessoes').select('*').eq('usuaria_id', usuariaId),
    supabase.from('jornadas_usuarias').select('*').eq('usuaria_id', usuariaId),
    supabase.from('conclusoes_praticas_conteudo').select('*').eq('usuaria_id', usuariaId),
    supabase.from('carteiras_petalas').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('transacoes_petalas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_desafio_semanal').select('*').eq('usuaria_id', usuariaId),
    supabase.from('resgates_recompensas').select('*').eq('usuaria_id', usuariaId),
    supabase.from('preferencias_notificacoes').select('*').eq('usuaria_id', usuariaId).maybeSingle(),
    supabase.from('intencao_pagamento').select('*').eq('usuaria_id', usuariaId),
  ]);

  const primeiroErro = [
    erroPerfil,
    erroCheckins,
    erroSessoes,
    erroJornadasUsuarias,
    erroConclusoes,
    erroCarteira,
    erroTransacoes,
    erroResgatesDesafio,
    erroResgatesRecompensas,
    erroPreferencias,
    erroIntencao,
  ].find(Boolean);

  if (primeiroErro) {
    console.error('[privacidade] Falha ao preparar exportação de dados', {
      code: primeiroErro.code,
      message: primeiroErro.message,
    });
    return { erro: 'Não foi possível preparar seus dados agora. Tente novamente.' };
  }

  const pacote = {
    exportado_em: new Date().toISOString(),
    conta: { id: user.id, email: user.email, criado_em: user.created_at },
    perfil: perfilExportavel(perfil),
    checkins: checkins ?? [],
    jornadas: jornadasUsuarias ?? [],
    praticas: {
      sessoes: sessoes ?? [],
      praticas_avulsas_concluidas: conclusoesPraticas ?? [],
    },
    petalas: {
      saldo: carteira?.saldo ?? 0,
      transacoes: transacoesPetalas ?? [],
    },
    recompensas: {
      resgates: resgatesRecompensas ?? [],
      desafios_semanais_concluidos: resgatesDesafio ?? [],
    },
    notificacoes: preferenciasNotificacoes ?? null,
    intencao_pagamento: intencaoPagamento ?? [],
  };

  return { dados: JSON.stringify(pacote, null, 2) };
}

export async function enviarConfirmacaoExclusao(): Promise<{ erro?: string; emailEnviado?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login');
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? `https://${headersList.get('host')}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      emailRedirectTo: `${origin}/api/perfil/confirmar-exclusao`,
    },
  });

  if (error) {
    console.error('[privacidade] Falha ao enviar link de confirmação de exclusão', {
      code: error.code,
      message: error.message,
    });
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return { erro: 'Aguarde alguns segundos antes de pedir outro link.' };
    }
    return { erro: 'Não foi possível enviar o link de confirmação. Tente novamente.' };
  }

  return { emailEnviado: user.email };
}
