import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import ExcluirDefinitivamenteBotao from './ExcluirDefinitivamenteBotao';

export default async function ConfirmarExclusaoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-12">
      <CabecalhoSubpagina
        titulo="Confirmar exclusão"
        subtitulo="Identidade confirmada pelo link enviado por e-mail"
        voltarHref="/perfil/privacidade"
      />

      <div className="space-y-3 rounded-2xl border border-alerta/40 bg-superficie p-4">
        <p className="text-sm text-texto">
          Esta é a última etapa. Ao confirmar, sua conta <strong>{user.email}</strong> e todos os seus
          dados (perfil, check-ins, sessões de prática, assinaturas de notificação) são apagados
          permanentemente. Não é possível desfazer esta ação.
        </p>
        <ExcluirDefinitivamenteBotao />
      </div>
    </main>
  );
}
