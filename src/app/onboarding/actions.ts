'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizarNome } from '@/lib/perfil/nome';
import type { PaisSuportado } from '@/lib/perfil/pais';
import { PAISES_SUPORTADOS } from '@/lib/perfil/pais';

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

  // País é sempre a última etapa do onboarding (proxy.ts só libera o app
  // depois de pais_confirmado_em existir) — então este é o único ponto do
  // fluxo em que "cadastro concluído" é verdade pela primeira vez. O
  // parâmetro é só um sinal para a Home disparar o evento CompleteRegistration
  // do TikTok Pixel uma única vez; ela mesma remove o parâmetro da URL depois.
  redirect('/?cadastro=concluido');
}
