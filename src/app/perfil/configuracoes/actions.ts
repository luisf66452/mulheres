'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fusoHorarioValido } from '@/lib/perfil/fusosHorarios';

// Atualiza SOMENTE fuso_horario — de propósito separada de
// atualizarPerfilCompleto (perfil/editar/actions.ts), que reenviaria
// nome/frase/faixa etária já carregados no client e poderia sobrescrever uma
// edição concorrente feita em outra aba/dispositivo (race condition).
export async function atualizarFusoHorario(fusoHorario: string): Promise<{ erro?: string; sucesso?: boolean }> {
  if (!fusoHorarioValido(fusoHorario)) {
    return { erro: 'Selecione um fuso horário válido.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('perfis').update({ fuso_horario: fusoHorario }).eq('id', user.id);

  if (error) {
    console.error('[configuracoes] Falha ao salvar fuso horário', { code: error.code, message: error.message });
    return { erro: 'Não foi possível salvar o fuso horário agora. Tente novamente.' };
  }

  return { sucesso: true };
}
