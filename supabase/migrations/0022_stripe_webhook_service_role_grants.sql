-- 0022_stripe_webhook_service_role_grants.sql
-- O endpoint do webhook do Stripe (src/app/api/stripe/webhook/route.ts) usa
-- createSupabaseAdminClient (service role) para registrar idempotência em
-- stripe_eventos_processados e promover/rebaixar perfis.plano. service_role
-- ignora RLS, mas ainda depende de GRANT explícito no schema/tabela — sem
-- isso a chamada falha com "permission denied" (42501/42501-like), mesmo com
-- a policy certa, o mesmo padrão de 0002_grants.sql para authenticated.

grant usage on schema public to service_role;

grant insert on public.stripe_eventos_processados to service_role;

grant select, update on public.perfis to service_role;

-- Sem isto, o PostgREST só percebe os GRANTs acima na próxima detecção
-- automática de mudança de schema — força o reload imediato do cache.
notify pgrst, 'reload schema';
