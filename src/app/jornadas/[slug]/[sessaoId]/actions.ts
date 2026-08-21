'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { concederPetalas } from '@/lib/clube-rose/concederPetalas';
import { VALORES_PETALAS } from '@/lib/clube-rose/config';
import { registrarConclusaoSessao } from '@/lib/jornadas-conteudo/progresso';
import { idPetalasParaSessao } from '@/lib/jornadas-conteudo/idPetalas';

export async function concluirSessao(jornadaSlug: string, sessaoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { concluidaAgora } = await registrarConclusaoSessao(supabase, user.id, jornadaSlug, sessaoId);

  revalidatePath(`/jornadas/${jornadaSlug}/${sessaoId}`);
  revalidatePath(`/jornadas/${jornadaSlug}`);
  revalidatePath('/jornadas');

  if (concluidaAgora) {
    // createSupabaseAdminClient() usa a service_role — a RPC conceder_petalas
    // exige esse cliente, o cliente autenticado comum não tem permissão.
    await concederPetalas(
      createSupabaseAdminClient(),
      user.id,
      'sessao_jornada_primeira_conclusao',
      idPetalasParaSessao(sessaoId),
      VALORES_PETALAS.sessaoJornadaPrimeiraConclusao
    );
  }
}
