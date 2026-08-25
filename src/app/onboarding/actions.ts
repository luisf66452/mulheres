'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizarNome } from '@/lib/perfil/nome';
import type { PaisSuportado } from '@/lib/perfil/pais';
import { PAISES_SUPORTADOS } from '@/lib/perfil/pais';
import {
  validarObjetivos,
  normalizarObjetivosParaGravar,
  validarTemasSensiveis,
  normalizarTemasParaGravar,
} from '@/lib/perfil/personalizacao';

export async function registrarConsentimento(nomeBruto?: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('perfis')
    .update({
      consentimento_dados_sensiveis_em: new Date().toISOString(),
      nome: normalizarNome(nomeBruto ?? ''),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[registrarConsentimento] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { erro: 'Não foi possível registrar seu consentimento. Tente novamente.' };
  }

  // Não redireciona aqui — quem chama decide se ainda falta a etapa de país
  // (ver OnboardingClient) antes de mandar a usuária para o app.
  return {};
}

// `pais` só é gravável pelo client autenticado através desta action com
// service role (ver migração 0012_perfis_trava_colunas_sensiveis.sql: a
// coluna é deliberadamente excluída do GRANT de UPDATE direto do PostgREST,
// para não reabrir a superfície de auto-alteração que aquela migração
// fechou). A action valida a lista de países suportados e nunca sobrescreve
// uma confirmação que já existe.
export async function confirmarPais(paisEscolhido: string): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!PAISES_SUPORTADOS.includes(paisEscolhido as PaisSuportado)) {
    return { erro: 'País não suportado.' };
  }
  const pais = paisEscolhido as PaisSuportado;

  const { data: perfilAtual } = await supabase
    .from('perfis')
    .select('pais_confirmado_em')
    .eq('id', user.id)
    .single();

  // Já confirmado antes — não sobrescreve silenciosamente (mesmo se a
  // usuária, por algum motivo, reenviar este formulário de novo).
  if (perfilAtual?.pais_confirmado_em) {
    redirect('/');
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível confirmar o país agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ pais, pais_confirmado_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[confirmarPais] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível confirmar o país agora. Tente novamente.' };
  }

  // País deixou de ser a última etapa do onboarding: a partir desta mudança
  // (design seção 2), a personalização (objetivos/temas/lembrete) vem em
  // seguida, dentro do mesmo OnboardingClient. Quem decide para onde ir a
  // partir daqui é o client (avança para a etapa 'objetivos', ou pula direto
  // para '/' se personalizacaoJaConcluida). O evento CompleteRegistration do
  // TikTok Pixel passou a disparar só ao final dessa nova etapa — ver
  // concluirPersonalizacao, abaixo, que é quem agora redireciona para
  // '/?cadastro=concluido'.
  return {};
}

/**
 * Grava perfis.objetivos — validado contra a lista fechada em
 * src/lib/perfil/personalizacao.ts. "Prefiro decidir depois" nunca entra no
 * array (normalizarObjetivosParaGravar grava '{}' nesse caso). Sem GRANT de
 * UPDATE direto para essa coluna — escreve via admin client, mesmo padrão de
 * confirmarPais. Pode ser chamada de novo a qualquer momento (edição
 * posterior em /perfil/personalizacao) — sempre substitui o array inteiro.
 */
export async function salvarObjetivos(selecionados: string[]): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!validarObjetivos(selecionados)) {
    return { erro: 'Seleção de objetivos inválida.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ objetivos: normalizarObjetivosParaGravar(selecionados) })
    .eq('id', user.id);

  if (error) {
    console.error('[salvarObjetivos] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' };
  }

  return {};
}

/**
 * Grava perfis.temas_sensiveis — mesmo padrão de salvarObjetivos.
 * "Prefiro não responder" nunca entra no array; "nenhum desses" entra (é uma
 * resposta legítima, só exclusiva na UI — ver SeletorTemasSensiveis).
 */
export async function salvarTemasSensiveis(selecionados: string[]): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!validarTemasSensiveis(selecionados)) {
    return { erro: 'Seleção de temas sensíveis inválida.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível salvar seus temas agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ temas_sensiveis: normalizarTemasParaGravar(selecionados) })
    .eq('id', user.id);

  if (error) {
    console.error('[salvarTemasSensiveis] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível salvar seus temas agora. Tente novamente.' };
  }

  return {};
}

/**
 * Última etapa do onboarding personalizado. `horarioLembrete` é `null`
 * quando a usuária escolheu "não quero lembretes agora" (nenhuma preferência
 * é gravada nesse caso — comportamento distinto de gravar uma string vazia).
 * Quando não-nulo, grava horario_preferido_notificacao pelo client
 * autenticado normal (coluna já tem GRANT de UPDATE — migração 0033, mesmo
 * caminho de salvarHorarioPreferido em src/app/settings/actions.ts). Em
 * seguida marca onboarding_extra_concluido_em (admin client, sem GRANT
 * direto) e redireciona para '/?cadastro=concluido' — único ponto do app,
 * a partir desta mudança, em que a Home dispara o evento CompleteRegistration
 * (ver TikTokCompleteRegistration.tsx, não alterado por este plano).
 */
export async function concluirPersonalizacao(horarioLembrete: string | null): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (horarioLembrete !== null) {
    const { error: erroHorario } = await supabase
      .from('perfis')
      .update({ horario_preferido_notificacao: horarioLembrete })
      .eq('id', user.id);

    if (erroHorario) {
      console.error('[concluirPersonalizacao] erro ao salvar horário preferido:', {
        userId: user.id,
        code: erroHorario.code,
        message: erroHorario.message,
      });
      return { erro: 'Não foi possível salvar seu lembrete agora. Tente novamente.' };
    }
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível concluir a personalização agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ onboarding_extra_concluido_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[concluirPersonalizacao] erro ao marcar conclusão:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível concluir a personalização agora. Tente novamente.' };
  }

  redirect('/?cadastro=concluido');
}

/**
 * Usada só pelo banner dispensável em /perfil (usuárias antigas, que já
 * passaram pelo onboarding antes dessa etapa existir). Grava só
 * onboarding_extra_dispensado_em — nunca onboarding_extra_concluido_em, que
 * fica reservado para quem de fato passou pela etapa (mesmo escolhendo
 * "prefiro decidir depois"/"prefiro não responder" em tudo).
 */
export async function dispensarPersonalizacao(): Promise<{ erro?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Não autenticada.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { erro: 'Não foi possível agora. Tente novamente.' };
  }

  const { error } = await admin
    .from('perfis')
    .update({ onboarding_extra_dispensado_em: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[dispensarPersonalizacao] erro ao atualizar perfis:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível dispensar agora. Tente novamente.' };
  }

  return {};
}
