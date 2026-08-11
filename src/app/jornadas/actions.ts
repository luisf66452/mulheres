'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decidirTrocaDeJornada } from '@/lib/jornadas/troca';

export async function ativarJornada(jornadaAlvoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: jornadaAtivaAtual } = await supabase
    .from('jornadas_usuarias')
    .select('id, jornada_id')
    .eq('usuaria_id', user.id)
    .eq('status', 'em_andamento')
    .maybeSingle();

  const { data: progressoExistenteNoAlvo } = await supabase
    .from('jornadas_usuarias')
    .select('id, dias_completados')
    .eq('usuaria_id', user.id)
    .eq('jornada_id', jornadaAlvoId)
    .maybeSingle();

  const decisao = decidirTrocaDeJornada({
    jornadaAtivaAtual: jornadaAtivaAtual
      ? { id: jornadaAtivaAtual.id, jornadaId: jornadaAtivaAtual.jornada_id }
      : null,
    jornadaAlvoId,
    progressoExistenteNoAlvo: progressoExistenteNoAlvo
      ? { id: progressoExistenteNoAlvo.id, diasCompletados: progressoExistenteNoAlvo.dias_completados }
      : null,
  });

  if (decisao.pausar) {
    await supabase
      .from('jornadas_usuarias')
      .update({ status: 'pausada' })
      .eq('id', decisao.pausar.id);
  }

  if (decisao.ativar === 'criar_nova') {
    await supabase.from('jornadas_usuarias').insert({
      usuaria_id: user.id,
      jornada_id: jornadaAlvoId,
      status: 'em_andamento',
    });
  } else {
    await supabase
      .from('jornadas_usuarias')
      .update({ status: 'em_andamento' })
      .eq('id', decisao.ativar.id);
  }

  redirect('/jornadas');
}
