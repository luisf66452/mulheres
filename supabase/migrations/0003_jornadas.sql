-- Jornadas guiadas (programas progressivos, curados pela psicóloga)
create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  duracao_dias smallint not null check (duracao_dias between 7 and 21),
  status text not null default 'rascunho' check (status in ('rascunho', 'revisada', 'publicada')),
  criado_em timestamptz not null default now()
);

alter table public.jornadas enable row level security;

create policy "qualquer usuaria autenticada le jornadas publicadas"
  on public.jornadas for select
  using (auth.role() = 'authenticated' and status = 'publicada');

-- Atividades de cada dia de uma jornada
create table public.jornada_atividades (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  numero_dia smallint not null,
  titulo text not null,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  unique (jornada_id, numero_dia)
);

alter table public.jornada_atividades enable row level security;

create policy "qualquer usuaria autenticada le atividades de jornadas publicadas"
  on public.jornada_atividades for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.jornadas j
      where j.id = jornada_atividades.jornada_id
      and j.status = 'publicada'
    )
  );

-- Progresso de cada usuária em cada jornada que já começou
create table public.jornadas_usuarias (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  jornada_id uuid not null references public.jornadas(id) on delete cascade,
  dias_completados smallint not null default 0,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'pausada', 'concluida')),
  iniciada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  concluida_em timestamptz,
  unique (usuaria_id, jornada_id)
);

-- Só uma jornada "em_andamento" por usuária ao mesmo tempo, garantido pelo banco.
create unique index jornadas_usuarias_uma_ativa_por_usuaria
  on public.jornadas_usuarias (usuaria_id)
  where status = 'em_andamento';

alter table public.jornadas_usuarias enable row level security;

create policy "usuaria le proprio progresso de jornadas"
  on public.jornadas_usuarias for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprio progresso de jornadas"
  on public.jornadas_usuarias for insert
  with check (auth.uid() = usuaria_id);

create policy "usuaria atualiza proprio progresso de jornadas"
  on public.jornadas_usuarias for update
  using (auth.uid() = usuaria_id);

-- Mantém atualizada_em sempre em dia a cada UPDATE em jornadas_usuarias, para que
-- a coluna reflita a última atividade real em vez de ficar congelada no valor de
-- iniciada_em.
create function public.set_atualizada_em_jornadas_usuarias()
returns trigger as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$ language plpgsql;

create trigger jornadas_usuarias_atualizada_em
  before update on public.jornadas_usuarias
  for each row execute procedure public.set_atualizada_em_jornadas_usuarias();

-- sessoes passa a aceitar atividades de jornada, não só práticas avulsas
alter table public.sessoes alter column pratica_id drop not null;
alter table public.sessoes add column jornada_atividade_id uuid references public.jornada_atividades(id);
alter table public.sessoes add constraint sessoes_uma_fonte_de_atividade
  check (
    (pratica_id is not null and jornada_atividade_id is null) or
    (pratica_id is null and jornada_atividade_id is not null)
  );

-- Garante idempotência: no máximo uma sessão por check-in, mesmo sob requisições
-- concorrentes (double-click, retry de rede). Fecha também uma race condition que
-- já existia no fluxo de prática avulsa.
--
-- Antes de rodar esta migração, verifique se já existem check-ins duplicados
-- na tabela sessoes (a query abaixo deve retornar zero linhas). Se retornar
-- linhas, esta constraint vai falhar e abortar o resto da migração — resolva
-- as duplicatas antes (ex: mantendo a linha de criado_em mais antigo por
-- checkin_id) e só então rode este arquivo:
--
--   select checkin_id, count(*) from public.sessoes group by checkin_id having count(*) > 1;
alter table public.sessoes add constraint sessoes_checkin_unico unique (checkin_id);

-- Privilégios de tabela — RLS só restringe QUAIS linhas, não concede acesso à tabela em si.
grant select on public.jornadas to authenticated;
grant select on public.jornada_atividades to authenticated;
grant select, insert, update on public.jornadas_usuarias to authenticated;
