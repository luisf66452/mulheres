-- 0033_perfis_relock_colunas_sensiveis.sql
-- ACHADO CRÍTICO durante o trabalho de confirmação de país (migração 0032):
-- ao adicionar `pais_confirmado_em`, uma consulta a
-- information_schema.column_privileges revelou que `authenticated` tinha
-- UPDATE em TODAS as colunas de public.perfis — incluindo `plano`, `role`,
-- `pais`, `stripe_customer_id` e `stripe_subscription_id` — apesar da
-- migração 0012_perfis_trava_colunas_sensiveis.sql existir especificamente
-- para impedir isso. Confirmado explorável de verdade nesta sessão: uma
-- usuária descartável real, autenticada via impersonação de JWT (nunca
-- service_role), conseguiu rodar
--   update perfis set plano = 'premium', role = 'admin' where id = auth.uid()
-- e o UPDATE foi aceito. O teste foi desfeito e a conta de teste apagada
-- logo em seguida.
--
-- Causa provável: o histórico real de migrations deste projeto (recuperado
-- via `supabase migration fetch`, ver migração de reconciliação anterior)
-- não é idêntico à sequência numerada deste repositório — alguma aplicação
-- fora de ordem ou um GRANT amplo posterior reabriu o que 0012 tinha
-- fechado. Em vez de tentar reconstruir exatamente o que aconteceu, esta
-- migração reafirma o estado correto de forma explícita e idempotente.
--
-- Efeito: revoga TODO update de authenticated em perfis e concede de novo
-- só nas colunas que o código do app legitimamente escreve como a própria
-- usuária. `plano`, `role`, `pais`, `pais_confirmado_em`, `id`, `criado_em`,
-- `stripe_customer_id` e `stripe_subscription_id` ficam de fora — todas só
-- graváveis por service_role (webhook do Stripe, ações administrativas, e a
-- action `confirmarPais` desta branch, que usa createSupabaseAdminClient).

revoke update on public.perfis from authenticated;

grant update (
  nome,
  frase_pessoal,
  faixa_etaria,
  fuso_horario,
  idioma,
  foto_url,
  horario_preferido_notificacao,
  consentimento_dados_sensiveis_em
) on public.perfis to authenticated;
