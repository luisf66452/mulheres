-- 0009_clube_rose_desafio_semanal.sql
-- Fase 3 do Clube Rose: registro de resgate do desafio semanal (1 por usuária/semana).
-- O progresso (etapas concluídas) é calculado sob demanda a partir de "sessoes" —
-- não há necessidade de uma tabela própria de progresso.

create table resgates_desafio_semanal (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  semana_inicio date not null,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, semana_inicio)
);

alter table resgates_desafio_semanal enable row level security;

create policy "usuaria vê seus resgates de desafio semanal" on resgates_desafio_semanal
  for select using (auth.uid() = usuaria_id);

create policy "usuaria registra seu próprio resgate de desafio semanal" on resgates_desafio_semanal
  for insert with check (auth.uid() = usuaria_id);

grant select, insert on resgates_desafio_semanal to authenticated;
