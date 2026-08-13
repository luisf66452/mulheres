import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';

const BENEFICIOS = [
  'Histórico completo de check-ins e progresso',
  'Insights semanais sobre seus padrões',
  'Biblioteca completa de práticas',
  'Todas as jornadas guiadas',
];

export default async function AssinaturaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error } = await supabase.from('perfis').select('plano').eq('id', user.id).single();

  const plano = perfil?.plano ?? 'free';
  const ehPremium = plano === 'premium';

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Minha assinatura" subtitulo="O estado real do seu plano" />

      {error ? (
        <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
          Não foi possível carregar sua assinatura agora. Tente novamente em instantes.
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
            <p className="text-xs text-texto-suave">Plano atual</p>
            <p className="font-display text-2xl text-texto">{ehPremium ? 'Premium' : 'Gratuito'}</p>
            {!ehPremium && (
              <p className="mt-2 text-sm text-texto-suave">
                Você está usando o Rose gratuitamente, sem nenhuma cobrança.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="font-display text-base text-texto">O que o plano completo incluiria</p>
            <ul className="mt-2 space-y-1.5 text-sm text-texto-suave">
              {BENEFICIOS.map((beneficio) => (
                <li key={beneficio}>• {beneficio}</li>
              ))}
            </ul>
          </div>

          {!ehPremium && (
            <div className="space-y-2 rounded-2xl border border-borda bg-superficie p-4">
              <p className="text-sm text-texto">
                Ainda não processamos pagamentos dentro do app — não existe cobrança real hoje.
              </p>
              <Link
                href="/premium"
                className="block w-full rounded-2xl bg-acao p-3 text-center font-medium text-white transition-colors hover:bg-acao/90"
              >
                Contar que eu assinaria
              </Link>
              <p className="text-xs text-texto-suave">
                Isso registra seu interesse e nos ajuda a decidir se vale a pena construir a versão
                paga — não gera nenhuma cobrança.
              </p>
            </div>
          )}
        </>
      )}

      <NavegacaoInferior />
    </main>
  );
}
