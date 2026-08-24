-- 20260824181939_favoritos.sql
-- Tabela de favoritos da usuária (seção 5 do design "Evolução da Rose Fase
-- 2"): permite marcar como favorito tanto uma prática do catálogo em banco
-- (public.praticas) quanto uma sessão de jornada, cujo catálogo vive em
-- código (src/lib/jornadas-conteudo/), não numa tabela — mesmo padrão de
-- sessao_id como texto sem FK já usado em
-- sessoes_jornadas_conteudo_progresso (migração
-- 20260818220822_sessoes_jornadas_conteudo_progresso.sql). Exatamente um dos
-- dois alvos (pratica_id XOR sessao_id) deve estar preenchido por linha —
-- nunca os dois, nunca nenhum.
create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  pratica_id uuid references public.praticas(id) on delete cascade,
  sessao_id text,
  criado_em timestamptz not null default now(),
  constraint favoritos_exatamente_um_alvo check ((pratica_id is not null) <> (sessao_id is not null))
);

-- Índices únicos parciais (não um único índice único composto): cada linha só
-- preenche pratica_id OU sessao_id, então um único índice único
-- (usuaria_id, pratica_id, sessao_id) não impediria duplicatas quando o outro
-- campo é null (NULL nunca é igual a NULL em índice único do Postgres).
create unique index if not exists favoritos_usuaria_pratica_key
  on public.favoritos (usuaria_id, pratica_id)
  where pratica_id is not null;

create unique index if not exists favoritos_usuaria_sessao_key
  on public.favoritos (usuaria_id, sessao_id)
  where sessao_id is not null;

alter table public.favoritos enable row level security;

-- CREATE POLICY não suporta IF NOT EXISTS no Postgres — usa
-- DROP POLICY IF EXISTS antes de cada CREATE para a migração poder ser
-- reexecutada com segurança.
drop policy if exists "usuaria le proprios favoritos" on public.favoritos;
create policy "usuaria le proprios favoritos"
  on public.favoritos for select
  using ((select auth.uid()) = usuaria_id);

drop policy if exists "usuaria insere proprios favoritos" on public.favoritos;
create policy "usuaria insere proprios favoritos"
  on public.favoritos for insert
  with check ((select auth.uid()) = usuaria_id);

drop policy if exists "usuaria remove proprios favoritos" on public.favoritos;
create policy "usuaria remove proprios favoritos"
  on public.favoritos for delete
  using ((select auth.uid()) = usuaria_id);

-- Sem policy de UPDATE de propósito — um favorito não muda de estado, só é
-- criado ou removido (favoritar/desfavoritar).

grant select, insert, delete on public.favoritos to authenticated;

notify pgrst, 'reload schema';
