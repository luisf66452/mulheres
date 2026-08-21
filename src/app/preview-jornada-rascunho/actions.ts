'use server';

import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { estaEmPreviewVercel } from '@/lib/supabase/previewOnly';

// Id fixo da jornada de 9 módulos gerada por
// scripts/gerarSeedJornadaEstruturada.ts (supabase/migrations/0030) —
// permanece status='rascunho' até a validação da psicóloga.
const JORNADA_RASCUNHO_ID = '22222222-2222-2222-2222-222222222222';

export async function ativarJornadaRascunhoPreview(): Promise<{ erro?: string }> {
  // Checagem redundante de propósito: mesmo se esta rota/página fosse
  // alcançada por engano fora de um deployment de Preview, a action em si
  // recusa. VERCEL_ENV não é controlável por nenhuma requisição.
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

  // INSERT em jornadas_usuarias não é bloqueado por RLS com base no status
  // da jornada (só por posse: usuaria_id = auth.uid()) — a usuária real,
  // autenticada normalmente, está apenas se inscrevendo na própria conta,
  // exatamente como uma futura tela "iniciar jornada" faria. Nenhum bypass
  // de autenticação: sem sessão, cai no redirect acima.
  const { error } = await supabase.from('jornadas_usuarias').insert({
    usuaria_id: user.id,
    jornada_id: JORNADA_RASCUNHO_ID,
  });

  if (error) {
    if (error.code === '23505') {
      // Já existe uma jornada em_andamento (unique parcial de
      // jornadas_usuarias) — provavelmente já inscrita antes; segue para o
      // check-in normalmente em vez de travar aqui.
      redirect('/checkin');
    }
    console.error('[ativarJornadaRascunhoPreview] erro ao inscrever:', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return { erro: 'Não foi possível ativar a jornada de teste agora. Tente novamente.' };
  }

  redirect('/checkin');
}
