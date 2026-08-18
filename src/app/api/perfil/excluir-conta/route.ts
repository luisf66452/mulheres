import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { obterStripe } from '@/lib/stripe/client';

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

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { erro: 'A exclusão de conta ainda não está disponível neste ambiente.' },
      { status: 501 }
    );
  }

  const usuariaId = user.id;

  // Cancela uma assinatura Stripe ativa antes de apagar a conta: sem isso, a
  // usuária continuaria sendo cobrada sem nenhum jeito de gerenciar/cancelar
  // (o Portal de Cobrança depende de uma conta autenticada, que deixará de
  // existir). Melhor esforço: se o Stripe não estiver configurado ou a
  // chamada falhar, a exclusão da conta segue mesmo assim — a privacidade da
  // usuária não pode ficar refém de uma falha externa de cobrança.
  const { data: perfilAssinatura } = await supabaseAdmin
    .from('perfis')
    .select('stripe_subscription_id, assinatura_status')
    .eq('id', usuariaId)
    .maybeSingle();

  if (
    perfilAssinatura?.stripe_subscription_id &&
    (perfilAssinatura.assinatura_status === 'active' || perfilAssinatura.assinatura_status === 'trialing')
  ) {
    const stripe = obterStripe();
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(perfilAssinatura.stripe_subscription_id);
      } catch (erroStripe) {
        console.error('[privacidade] Falha ao cancelar assinatura Stripe antes da exclusão', {
          message: erroStripe instanceof Error ? erroStripe.message : 'erro desconhecido',
        });
      }
    }
  }

  // Remove os arquivos de avatar da usuária no Storage: exclusão de
  // auth.users não apaga objetos de storage.objects automaticamente.
  const { data: arquivosAvatar } = await supabaseAdmin.storage.from('avatares').list(usuariaId);
  if (arquivosAvatar && arquivosAvatar.length > 0) {
    const caminhos = arquivosAvatar.map((arquivo) => `${usuariaId}/${arquivo.name}`);
    const { error: erroStorage } = await supabaseAdmin.storage.from('avatares').remove(caminhos);
    if (erroStorage) {
      console.error('[privacidade] Falha ao remover arquivos de avatar', { message: erroStorage.message });
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(usuariaId);

  if (error) {
    console.error('[privacidade] Falha ao excluir conta', { code: error.code, message: error.message });
    return NextResponse.json(
      { erro: 'Não foi possível excluir sua conta agora. Nada foi apagado. Tente novamente.' },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ sucesso: true });
}
