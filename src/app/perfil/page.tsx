import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import Botao from '@/app/components/Botao';
import CabecalhoPerfil from '@/app/components/perfil/CabecalhoPerfil';
import CartaoMenuPerfil from '@/app/components/perfil/CartaoMenuPerfil';
import IconePreferencias from '@/app/components/perfil/icones/IconePreferencias';
import IconeNotificacoes from '@/app/components/perfil/icones/IconeNotificacoes';
import IconeAssinatura from '@/app/components/perfil/icones/IconeAssinatura';
import IconePrivacidade from '@/app/components/perfil/icones/IconePrivacidade';
import IconeConfiguracoes from '@/app/components/perfil/icones/IconeConfiguracoes';
import { sair } from './actions';

const ITENS_MENU = [
  { href: '/perfil/preferencias', rotulo: 'Preferências', Icone: IconePreferencias },
  { href: '/perfil/notificacoes', rotulo: 'Notificações', Icone: IconeNotificacoes },
  { href: '/perfil/assinatura', rotulo: 'Minha assinatura', Icone: IconeAssinatura },
  { href: '/perfil/privacidade', rotulo: 'Privacidade', Icone: IconePrivacidade },
  { href: '/perfil/configuracoes', rotulo: 'Configurações', Icone: IconeConfiguracoes },
] as const;

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from('perfis')
    .select('nome, frase_pessoal')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-8">
      <CabecalhoPerfil nome={perfil?.nome ?? null} frase={perfil?.frase_pessoal ?? null} />

      <div className="space-y-6 px-4 pt-6">
        {erroPerfil && (
          <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
            Não foi possível carregar todos os dados do seu perfil agora. Algumas informações podem
            aparecer incompletas.
          </div>
        )}

        <nav aria-label="Menu do perfil" className="space-y-3">
          {ITENS_MENU.map((item) => (
            <CartaoMenuPerfil key={item.href} {...item} />
          ))}
        </nav>

        <form action={sair}>
          <Botao type="submit" variante="secundaria">
            Sair da conta
          </Botao>
        </form>
      </div>

      <NavegacaoInferior />
    </main>
  );
}
