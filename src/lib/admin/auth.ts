import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Porta de entrada única para qualquer página/ação administrativa. Não basta
// esconder a rota /admin no frontend — cada página e cada Server Action sob
// /admin chama isto explicitamente, que autentica e checa perfis.role no
// servidor antes de mostrar qualquer coisa ou executar qualquer mutação.
// perfis.role só é gravável pela service role (migração 0016) — nenhuma
// usuária consegue se autopromover a admin através do app.
export async function exigirAdmin(): Promise<{ id: string; email: string | null }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single();

  if (perfil?.role !== 'admin') {
    redirect('/');
  }

  return { id: user.id, email: user.email ?? null };
}
