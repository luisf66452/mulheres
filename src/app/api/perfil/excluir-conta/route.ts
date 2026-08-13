import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

// Exclusão real e irreversível da conta. Só roda no servidor: usa a
// SUPABASE_SERVICE_ROLE_KEY (nunca enviada ao navegador) e opera
// exclusivamente sobre o id do usuário da sessão atual — nunca aceita um id
// vindo do corpo da requisição, para impedir que alguém apague outra conta.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { erro: 'A exclusão de conta ainda não está disponível neste ambiente.' },
      { status: 501 }
    );
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { erro: 'Não foi possível excluir sua conta agora. Nada foi apagado. Tente novamente.' },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ sucesso: true });
}
