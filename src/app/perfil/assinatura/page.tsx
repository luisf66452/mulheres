import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavegacaoInferior from '@/app/components/NavegacaoInferior';
import CabecalhoSubpagina from '@/app/components/perfil/CabecalhoSubpagina';
import { obterStripe } from '@/lib/stripe/client';
import {
  buscarPrecoDetalhado,
  calcularPercentualEconomiaAnual,
  obterMoedaELocaleDoPais,
  obterPriceId,
  stripeConfigurado,
} from '@/lib/stripe/planos';
import TikTokPurchase from '@/app/components/tiktok/TikTokPurchase';
import MetaSubscribe from '@/app/components/meta/MetaSubscribe';
import BotaoAssinar from './BotaoAssinar';
import BotaoGerenciarAssinatura from './BotaoGerenciarAssinatura';
import SeloProvaSocial from '@/app/components/inicio/SeloProvaSocial';
import ModalAgradecimento from './ModalAgradecimento';

const BENEFICIOS = [
  'Histórico completo de check-ins e progresso',
  'Insights semanais sobre seus padrões',
  'Biblioteca completa de práticas',
  'Todas as jornadas guiadas',
  'Recompensas exclusivas no Clube Rose',
];

const ROTULOS_STATUS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Pagamento não realizado',
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { checkout, session_id: sessionId } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil, error } = await supabase
    .from('perfis')
    .select('plano, assinatura_status, assinatura_periodo_fim, pais')
    .eq('id', user.id)
    .single();

  if (error) {
    // Mensagem sanitizada: só código/detalhe do erro do PostgREST, nunca
    // dado da usuária (sem id, email ou cookies), para permitir diagnosticar
    // falhas futuras (ex.: coluna ausente por migração não aplicada) sem
    // expor informação sensível no log.
    console.error('[perfil/assinatura] Falha ao carregar perfil da usuária:', {
      code: error.code,
      message: error.message,
    });
  }

  const plano = perfil?.plano ?? 'free';
  const ehPremium = plano === 'premium';
  const assinaturaConfigurada = stripeConfigurado();

  // Mesma moeda que a rota de checkout vai realmente usar (deriva do país
  // salvo no perfil) — mostra o preço real antes do redirecionamento, nunca
  // um valor fixo que possa ficar desatualizado em relação ao Stripe.
  let precoMensal: string | null = null;
  let precoAnual: string | null = null;
  let percentualEconomiaAnual: number | null = null;
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
      if (detalheMensal && detalheAnual) {
        percentualEconomiaAnual = calcularPercentualEconomiaAnual(detalheMensal.unitAmount, detalheAnual.unitAmount);
      }
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-24 md:pb-8">
      <CabecalhoSubpagina titulo="Minha assinatura" subtitulo="O estado real do seu plano" />

      {checkout === 'sucesso' && sessionId && <TikTokPurchase sessionId={sessionId} />}
      {checkout === 'sucesso' && sessionId && <MetaSubscribe sessionId={sessionId} />}

      {checkout === 'sucesso' && <ModalAgradecimento />}
      {checkout === 'cancelado' && (
        <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
          Checkout cancelado — nenhuma cobrança foi feita.
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-suave">
          Não foi possível carregar sua assinatura agora. Tente novamente em instantes.
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-superficie p-4 shadow-[0_2px_8px_rgba(74,63,53,0.08)]">
            <p className="text-xs text-texto-suave">Plano atual</p>
            <p className="font-display text-2xl text-texto">{ehPremium ? 'Rose Pro' : 'Gratuito'}</p>
            {!ehPremium && (
              <p className="mt-2 text-sm text-texto-suave">
                Você está usando o Rose gratuitamente, sem nenhuma cobrança.
              </p>
            )}
            {ehPremium && perfil?.assinatura_status && (
              <p className="mt-2 text-sm text-texto-suave">
                Status: {ROTULOS_STATUS[perfil.assinatura_status] ?? perfil.assinatura_status}
                {perfil.assinatura_periodo_fim &&
                  ` · Renova em ${new Date(perfil.assinatura_periodo_fim).toLocaleDateString('pt-BR')}`}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-borda bg-superficie p-4">
            <p className="font-display text-base text-texto">O que o Rose Pro inclui</p>
            {!ehPremium && (
              <div className="mt-2">
                <SeloProvaSocial />
              </div>
            )}
            <ul className="mt-2 space-y-1.5 text-sm text-texto-suave">
              {BENEFICIOS.map((beneficio) => (
                <li key={beneficio}>• {beneficio}</li>
              ))}
            </ul>
          </div>

          {ehPremium && <BotaoGerenciarAssinatura />}

          {!ehPremium && assinaturaConfigurada && (
            <div className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
              {(precoMensal || precoAnual) && (
                <div className="space-y-1 text-sm text-texto-suave">
                  {precoMensal && <p>Mensal: {precoMensal}</p>}
                  {precoAnual && <p>Anual: {precoAnual}</p>}
                </div>
              )}
              <BotaoAssinar plano="mensal" rotulo="Assinar mensal" />
              <BotaoAssinar
                plano="anual"
                rotulo={
                  percentualEconomiaAnual ? `Assinar anual (economize ${percentualEconomiaAnual}%)` : 'Assinar anual'
                }
              />
              <p className="text-xs text-texto-suave">
                Pagamento processado com segurança pelo Stripe. Cancele quando quiser, sem multa.
              </p>
            </div>
          )}

          {!ehPremium && !assinaturaConfigurada && (
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
