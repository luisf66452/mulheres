-- 0029_jornada_modulos_estruturados.sql
-- Renumerada de 0026 para 0029: a branch experiencia-completa já tinha
-- ocupado 0026-0028 (viagem_surpresa_rose, push_envios_idempotencia,
-- sessoes_jornadas_conteudo_progresso), aplicadas em produção antes desta
-- migração ser escrita — ver histórico recuperado via
-- `supabase migration fetch` em 0026_viagem_surpresa_rose.sql.
-- Suporte a módulos psicoeducativos estruturados dentro de uma jornada (Sistema A:
-- jornadas/jornada_atividades/jornadas_usuarias). Não altera o comportamento das
-- jornadas existentes: conteudo_estruturado é opcional e coexiste com `conteudo`
-- texto; quando é nulo, o app continua renderizando a atividade exatamente como
-- hoje (ver AntesDepoisAtividade).

alter table public.jornada_atividades
  add column conteudo_estruturado jsonb,
  add column schema_version smallint;

alter table public.jornada_atividades
  add constraint jornada_atividades_estruturado_consistente
  check (
    (conteudo_estruturado is null and schema_version is null) or
    (conteudo_estruturado is not null and schema_version is not null
     and jsonb_typeof(conteudo_estruturado) = 'object')
  );

-- Respostas da usuária a um módulo estruturado: um documento jsonb por
-- (usuária, atividade) — não uma linha por campo — para permitir upsert do
-- rascunho sem duplicar linhas e sem exigir migração de schema toda vez que um
-- módulo ganha ou perde um campo de exercício.
create table public.jornada_respostas_modulo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  jornada_usuario_id uuid not null references public.jornadas_usuarias(id) on delete cascade,
  atividade_id uuid not null references public.jornada_atividades(id) on delete cascade,
  sessao_id uuid references public.sessoes(id) on delete set null,
  schema_version smallint not null,
  respostas jsonb not null check (jsonb_typeof(respostas) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, atividade_id)
);

comment on table public.jornada_respostas_modulo is
  'Respostas de exercícios psicoeducativos por usuária. Pode conter dados '
  'psicológicos sensíveis (emoções, pensamentos, situações relatadas) — nunca '
  'expor em logs, analytics ou mensagens de erro.';

alter table public.jornada_respostas_modulo enable row level security;

create policy "usuaria le proprias respostas de modulo"
  on public.jornada_respostas_modulo for select
  using ((select auth.uid()) = user_id);

create policy "usuaria insere proprias respostas de modulo"
  on public.jornada_respostas_modulo for insert
  with check ((select auth.uid()) = user_id);

create policy "usuaria atualiza proprias respostas de modulo"
  on public.jornada_respostas_modulo for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Sem policy de delete: usuárias não apagam respostas pelo client. Sem grant a
-- anon: acesso anônimo à tabela fica impossível independentemente das policies.

-- A policy acima só confere `user_id` — sozinha, ela não impede que uma usuária
-- anexe sua resposta à inscrição de jornada (jornada_usuario_id) de outra
-- pessoa, caso descubra ou adivinhe o id. Este trigger garante que
-- jornada_usuario_id e atividade_id realmente pertencem à mesma usuária e à
-- mesma jornada antes de aceitar o INSERT/UPDATE.
create function public.verificar_propriedade_resposta_modulo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  jornada_usuaria_dona uuid;
  jornada_da_inscricao uuid;
  jornada_da_atividade uuid;
begin
  select usuaria_id, jornada_id into jornada_usuaria_dona, jornada_da_inscricao
  from public.jornadas_usuarias
  where id = new.jornada_usuario_id;

  if jornada_usuaria_dona is null then
    raise exception 'jornada_usuario_id inválido';
  end if;

  if jornada_usuaria_dona <> new.user_id then
    raise exception 'jornada_usuario_id não pertence à usuária informada';
  end if;

  select jornada_id into jornada_da_atividade
  from public.jornada_atividades
  where id = new.atividade_id;

  if jornada_da_atividade is null or jornada_da_atividade <> jornada_da_inscricao then
    raise exception 'atividade_id não pertence à jornada da inscrição informada';
  end if;

  return new;
end;
$$;

revoke execute on function public.verificar_propriedade_resposta_modulo() from public, anon, authenticated;

create trigger jornada_respostas_modulo_verifica_propriedade
  before insert or update on public.jornada_respostas_modulo
  for each row execute procedure public.verificar_propriedade_resposta_modulo();

create function public.set_updated_at_jornada_respostas_modulo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at_jornada_respostas_modulo() from public, anon, authenticated;

create trigger jornada_respostas_modulo_updated_at
  before update on public.jornada_respostas_modulo
  for each row execute procedure public.set_updated_at_jornada_respostas_modulo();

-- Privilégios de tabela — RLS só restringe QUAIS linhas; sem este GRANT toda
-- operação falharia com "permission denied for table" mesmo com policy correta.
-- anon não aparece aqui de propósito: fica sem nenhum acesso à tabela.
grant select, insert, update on public.jornada_respostas_modulo to authenticated;
