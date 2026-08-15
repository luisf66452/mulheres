-- 0019_assinatura_stripe.sql
-- Fase 4: assinatura Pro via Stripe. perfis.plano continua sendo o campo
-- lido em todo o app (já travado contra escrita do client desde 0012) — só
-- ganha novas colunas de apoio para ligar a linha da usuária ao cliente e à
-- assinatura no Stripe, e para refletir o status real vindo dos webhooks.

alter table perfis
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column assinatura_status text,
  add column assinatura_periodo_fim timestamptz;

-- Evita duas usuárias apontando pro mesmo customer/subscription do Stripe
-- por um bug de sincronização (índice parcial: null não conflita).
create unique index perfis_stripe_customer_id_idx
  on perfis (stripe_customer_id) where stripe_customer_id is not null;

create unique index perfis_stripe_subscription_id_idx
  on perfis (stripe_subscription_id) where stripe_subscription_id is not null;

-- Idempotência de webhook: o Stripe pode reentregar o mesmo evento mais de
-- uma vez (rede, timeout, retry manual). Cada id de evento só é processado
-- uma vez — a linha é inserida ANTES de processar; se já existir
-- (unique_violation), o handler ignora e responde 200 sem reprocessar.
create table stripe_eventos_processados (
  id text primary key,
  tipo text not null,
  processado_em timestamptz not null default now()
);

alter table stripe_eventos_processados enable row level security;
-- Sem policy criada de propósito: só a service role (usada pelo endpoint de
-- webhook) acessa esta tabela — mesmo padrão de acessos_administrativos em
-- 0001_init.sql. Nenhum client (anon/authenticated) deve ler ou escrever aqui.
