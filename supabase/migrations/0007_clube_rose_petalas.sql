-- 0007_clube_rose_petalas.sql
-- Fase 1 do Clube Rose: carteira de Pétalas e transações idempotentes.

create table carteiras_petalas (
  usuaria_id uuid primary key references auth.users(id) on delete cascade,
  saldo integer not null default 0 check (saldo >= 0),
  atualizada_em timestamptz not null default now()
);

create type tipo_evento_petalas as enum (
  'checkin_diario',
  'pratica_primeira_conclusao',
  'sessao_jornada_primeira_conclusao',
  'jornada_completa',
  'desafio_semanal',
  'resgate_recompensa'
);

create table transacoes_petalas (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  tipo_evento tipo_evento_petalas not null,
  referencia_id uuid not null,
  quantidade integer not null,
  saldo_resultante integer not null,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, tipo_evento, referencia_id)
);

create index transacoes_petalas_usuaria_id_criado_em_idx
  on transacoes_petalas (usuaria_id, criado_em desc);

alter table carteiras_petalas enable row level security;
alter table transacoes_petalas enable row level security;

create policy "usuaria vê sua carteira" on carteiras_petalas
  for select using (auth.uid() = usuaria_id);

create policy "usuaria vê suas transações" on transacoes_petalas
  for select using (auth.uid() = usuaria_id);

grant select on carteiras_petalas to authenticated;
grant select on transacoes_petalas to authenticated;

-- Cria a carteira automaticamente no signup, mesmo padrão de handle_new_user() em 0001_init.sql.
create or replace function handle_new_user_carteira_petalas()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into carteiras_petalas (usuaria_id, saldo)
  values (new.id, 0)
  on conflict (usuaria_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_carteira_petalas
  after insert on auth.users
  for each row execute function handle_new_user_carteira_petalas();
