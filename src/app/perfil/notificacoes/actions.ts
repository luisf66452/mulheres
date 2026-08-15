'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { preferenciasParaColunas, type NotificacoesPreferencias } from '@/lib/perfil/notificacoesPreferencias';

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
