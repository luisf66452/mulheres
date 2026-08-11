import { createSupabaseServerClient } from '@/lib/supabase/server';
import Cartao from '@/app/components/Cartao';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import { sair } from './actions';

const LABEL_PLANO: Record<string, string> = {
  free: 'Gratuito',
  premium: 'Premium',
};

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from('perfis')
    .select('plano')
    .eq('id', user!.id)
    .single();

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24 md:pb-6">
      <h1 className="font-display text-2xl text-texto">Perfil</h1>

      <Cartao className="space-y-3">
        <div>
          <p className="text-xs text-texto-suave">E-mail</p>
          <p className="text-texto">{user!.email}</p>
        </div>
        <div>
          <p className="text-xs text-texto-suave">Plano</p>
          <p className="text-texto">{LABEL_PLANO[perfil?.plano ?? 'free']}</p>
        </div>
      </Cartao>

      <div className="space-y-3">
        <a
          href="/settings"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Lembretes
        </a>
        <a
          href="/premium"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Versão Premium
        </a>
        <a
          href="/privacidade"
          className="block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto transition-colors hover:bg-fundo"
        >
          Privacidade e Termos de Uso
        </a>
      </div>

      <form action={sair}>
        <button
          type="submit"
          className="w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
        >
          Sair
        </button>
      </form>

      <NavegacaoInferior />
    </main>
  );
}
