'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { RespostaModuloV1 } from '@/lib/jornadas-modulos/tipos';

// Upsert do rascunho/resposta final de um módulo estruturado. Idempotente por
// (user_id, atividade_id) — chamar de novo com o mesmo par só atualiza o
// documento, nunca cria uma segunda linha (ver unique constraint na migration
// 0026). Nunca logar `params.respostas`: pode conter texto livre sensível.
export async function salvarRespostaModulo(params: {
  atividadeId: string;
  jornadaUsuarioId: string;
  respostas: RespostaModuloV1;
}): Promise<{ ok: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const { error } = await supabase.from('jornada_respostas_modulo').upsert(
    {
      user_id: user.id,
      jornada_usuario_id: params.jornadaUsuarioId,
      atividade_id: params.atividadeId,
      schema_version: params.respostas.schemaVersion,
      respostas: params.respostas,
    },
    { onConflict: 'user_id,atividade_id' }
  );

  if (error) {
    console.error('Não foi possível salvar a resposta do módulo (código:', error.code, ')');
    return { ok: false };
  }

  return { ok: true };
}
