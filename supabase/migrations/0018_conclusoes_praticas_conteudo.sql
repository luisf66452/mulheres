-- 0018_conclusoes_praticas_conteudo.sql
-- Fase 2 (ciclo principal): as práticas rápidas avulsas (Respiração,
-- Meditação, Diário guiado, Autocompaixão — conteúdo definido em código, ver
-- src/lib/praticas-conteudo/) registravam a conclusão só em localStorage
-- (src/lib/praticas-progresso/armazenamento.ts, marcado no próprio código
-- como "camada temporária"). Isso alimenta o cartão de Conquistas em
-- /progresso — informação relevante de progresso que não pode existir só no
-- navegador: some ao limpar dados do site e não aparece em outro
-- dispositivo/login.
--
-- pratica_id é texto (não uuid/FK) de propósito: essas práticas vêm de um
-- catálogo em código (PraticaRapida), desacoplado da tabela `praticas` usada
-- pelo fluxo de check-in — são dois catálogos de conteúdo diferentes.
--
-- Sem recompensa em Pétalas associada a este registro (só ele não concede
-- nada) — por isso o client pode inserir diretamente, mesmo padrão já usado
-- em `checkins`/`sessoes`: RLS restringe cada usuária à própria linha.

create table conclusoes_praticas_conteudo (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  pratica_id text not null,
  concluida_em timestamptz not null default now(),
  duracao_minutos integer not null
);

create index conclusoes_praticas_conteudo_usuaria_id_idx
  on conclusoes_praticas_conteudo (usuaria_id, concluida_em desc);

alter table conclusoes_praticas_conteudo enable row level security;

create policy "usuaria le suas conclusoes de praticas rapidas"
  on conclusoes_praticas_conteudo for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere suas conclusoes de praticas rapidas"
  on conclusoes_praticas_conteudo for insert
  with check (auth.uid() = usuaria_id);

-- Sem policy/grant de update/delete: registro imutável, mesmo padrão de
-- checkins/sessoes.
grant select, insert on conclusoes_praticas_conteudo to authenticated;
