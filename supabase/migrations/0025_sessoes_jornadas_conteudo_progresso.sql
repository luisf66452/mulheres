-- 0025_sessoes_jornadas_conteudo_progresso.sql
-- Progresso real da usuária nas 83 sessões de src/lib/jornadas-conteudo/
-- (biblioteca de programas temáticos: Módulo > Sessão > Conteúdo — modelo
-- SEPARADO do mais antigo jornadas/jornada_atividades/jornadas_usuarias,
-- dia a dia, usado pelo check-in). Antes desta migração, `concluida`,
-- `progresso` e `progressoPercentual` eram valores fixos escritos direto no
-- array de dados (mesmo para todas as usuárias) — não existia nenhum
-- registro real de quem começou ou terminou o quê.
--
-- sessao_id é texto (não uuid/FK) de propósito: o conteúdo das sessões vive
-- em código (src/lib/jornadas-conteudo/dados.ts), não numa tabela — mesmo
-- padrão já usado em conclusoes_praticas_conteudo (migração 0018) para as
-- práticas rápidas definidas em código.
create table sessoes_jornadas_conteudo_progresso (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  jornada_slug text not null,
  sessao_id text not null,
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  unique (usuaria_id, sessao_id)
);

create index sessoes_jornadas_conteudo_progresso_usuaria_jornada_idx
  on sessoes_jornadas_conteudo_progresso (usuaria_id, jornada_slug);

alter table sessoes_jornadas_conteudo_progresso enable row level security;

create policy "usuaria le proprio progresso de sessoes de jornadas"
  on sessoes_jornadas_conteudo_progresso for select
  using (auth.uid() = usuaria_id);

create policy "usuaria inicia suas proprias sessoes de jornadas"
  on sessoes_jornadas_conteudo_progresso for insert
  with check (auth.uid() = usuaria_id);

-- Update é o que marca conclusão (concluida_em) — a conclusão idempotente
-- depende de um UPDATE condicional (`where concluida_em is null`) feito pelo
-- código da aplicação, não de uma RPC; por isso a policy de update também é
-- necessária para o client autenticado, restrita à própria linha.
create policy "usuaria atualiza seu proprio progresso de sessoes de jornadas"
  on sessoes_jornadas_conteudo_progresso for update
  using (auth.uid() = usuaria_id)
  with check (auth.uid() = usuaria_id);

grant select, insert, update on sessoes_jornadas_conteudo_progresso to authenticated;
