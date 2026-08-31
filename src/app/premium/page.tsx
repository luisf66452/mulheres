import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { obterStripe } from '@/lib/stripe/client';
import { buscarPrecoDetalhado, obterMoedaELocaleDoPais, obterPriceId, stripeConfigurado } from '@/lib/stripe/planos';
import BotaoAssinar from '@/app/perfil/assinatura/BotaoAssinar';
import BotaoGerenciarAssinatura from '@/app/perfil/assinatura/BotaoGerenciarAssinatura';

const BENEFICIOS = [
  'Histórico completo de check-ins e progresso',
  'Insights semanais sobre seus padrões',
  'Biblioteca completa de práticas',
  'Todas as jornadas guiadas',
  'Recompensas exclusivas no Clube Rose',
];

export default async function PremiumPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error } = await supabase
    .from('perfis')
    .select('plano, pais')
    .eq('id', user.id)
    .single();

  const ehPremium = perfil?.plano === 'premium';
  const assinaturaConfigurada = stripeConfigurado();

  let precoMensal: string | null = null;
  let precoAnual: string | null = null;
  if (!ehPremium && assinaturaConfigurada) {
    const stripe = obterStripe();
    if (stripe) {
      const { moeda } = obterMoedaELocaleDoPais(perfil?.pais);
      const [detalheMensal, detalheAnual] = await Promise.all([
        buscarPrecoDetalhado(stripe, obterPriceId('mensal'), moeda),
        buscarPrecoDetalhado(stripe, obterPriceId('anual'), moeda),
      ]);
      precoMensal = detalheMensal?.formatado ?? null;
      precoAnual = detalheAnual?.formatado ?? null;
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="font-display text-2xl text-texto">Versão Premium</h1>
      <p className="text-texto">
        Histórico completo, insights semanais, biblioteca completa de práticas e jornadas guiadas.
      </p>

      <div className="rounded-2xl border border-borda bg-superficie p-4">
        <p className="font-display text-base text-texto">O que o Rose Pro inclui</p>
        <ul className="mt-2 space-y-1.5 text-sm text-texto-suave">
          {BENEFICIOS.map((beneficio) => (
            <li key={beneficio}>• {beneficio}</li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
          Não foi possível carregar sua assinatura agora. Tente novamente em instantes.
        </div>
      )}

      {!error && ehPremium && <BotaoGerenciarAssinatura />}

      {!error && !ehPremium && assinaturaConfigurada && (
        <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
          {(precoMensal || precoAnual) && (
            <div className="space-y-1 text-sm text-texto-suave">
              {precoMensal && <p>Mensal: {precoMensal}</p>}
              {precoAnual && <p>Anual: {precoAnual}</p>}
            </div>
          )}
          <BotaoAssinar plano="mensal" rotulo="Assinar mensal" />
          <BotaoAssinar plano="anual" rotulo="Assinar anual" />
          <p className="text-xs text-texto-suave">
            Pagamento processado com segurança pelo Stripe. Cancele quando quiser, sem multa.
          </p>
        </div>
      )}

      {!error && !ehPremium && !assinaturaConfigurada && (
        <div className="rounded-2xl border border-borda bg-superficie p-4">
          <p className="text-sm text-texto">Assinatura ainda não está disponível.</p>
        </div>
      )}

      <Link
        href="/perfil/assinatura"
        className="block w-full rounded-2xl border border-borda p-3 text-center font-medium text-texto-suave transition-colors hover:bg-superficie"
      >
        Ver detalhes da minha assinatura
      </Link>
    </main>
  );
}
