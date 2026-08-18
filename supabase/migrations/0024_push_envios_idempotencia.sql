-- 0024_push_envios_idempotencia.sql
-- Registro de envio de push por usuária + tipo de lembrete + dia local, para
-- que o cron (api/push/send-due) e o endpoint de teste nunca enviem duas
-- notificações do mesmo tipo no mesmo dia local da usuária — mesmo sob
-- reexecução do cron, retry, ou dois processos concorrentes (garantido pela
-- constraint unique, não só por lógica de aplicação).
create table push_envios (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('checkin', 'jornada', 'praticas', 'resumo_semanal', 'teste')),
  data_local date not null,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, tipo, data_local)
);

alter table push_envios enable row level security;

-- Tabela de bookkeeping interno do envio de push: só o cron/endpoint de
-- teste (service role) escreve ou lê — mesmo padrão de
-- stripe_eventos_processados (0019). Nenhuma policy/grant para
-- `authenticated`.

-- service_role ignora RLS mas ainda depende de GRANT explícito por tabela
-- (mesma lição registrada em 0022_stripe_webhook_service_role_grants.sql).
-- O cron (api/push/send-due) e o endpoint de teste (api/push/teste) usam
-- createSupabaseAdminClient e precisam ler perfis/push_subscriptions/
-- preferencias_notificacoes e escrever em push_subscriptions (limpeza de
-- inscrição expirada) e push_envios (idempotência) — nenhuma dessas duas
-- últimas tinha GRANT para service_role antes desta migração, o que fazia o
-- cron falhar silenciosamente (a query retorna erro de permissão, e o código
-- trata isso como "nenhuma usuária elegível" em vez de propagar o erro).
-- Também necessário pela mesma rota: decidirTipoNotificacao (prioridade.ts)
-- precisa saber se a usuária já fez check-in hoje e se tem jornada ativa —
-- checkins, jornadas e jornadas_usuarias nunca tiveram GRANT para
-- service_role (só para `authenticated`, em 0002_grants.sql/0003_jornadas.sql).
grant usage on schema public to service_role;
grant select on public.push_subscriptions to service_role;
grant delete on public.push_subscriptions to service_role;
grant select on public.preferencias_notificacoes to service_role;
grant select, insert on public.push_envios to service_role;
grant select on public.checkins to service_role;
grant select on public.jornadas to service_role;
grant select on public.jornadas_usuarias to service_role;

notify pgrst, 'reload schema';
