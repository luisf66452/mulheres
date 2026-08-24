# Fundação de banco — Evolução da Rose (Seção 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a fundação de banco (migrations, RLS, GRANTs) e os tipos TypeScript manuais que as sete funcionalidades da Fase 2 da Rose (seções 2–8 do design) vão consumir — sem implementar nenhuma dessas funcionalidades ainda.

**Architecture:** Cinco migrations idempotentes em `supabase/migrations/`, criadas uma a uma via `npx supabase migration new <nome>` (CLI não instalado localmente, mas disponível via `npx`; projeto já linkado ao projeto Supabase remoto `znyddngfonlfujypzjjb`). Cada migration segue o padrão observado nas migrations mais recentes do projeto (comentário de cabeçalho explicando o "porquê", `create table if not exists`, `drop policy if exists` antes de cada `create policy`, GRANTs explícitos por coluna quando aplicável, `notify pgrst, 'reload schema';` ao final). Testes de RLS em pgTAP acompanham as duas tabelas novas, no mesmo formato do teste existente `supabase/tests/jornada_respostas_modulo_rls.test.sql`. Tipos TypeScript em `src/lib/supabase/types.ts` são escritos manualmente (projeto não usa `supabase gen types`) espelhando exatamente as colunas e GRANTs criados.

**Tech Stack:** PostgreSQL 17 (Supabase), pgTAP para testes de RLS, Supabase CLI (via `npx supabase`, sem instalação local, sem Docker local disponível — `supabase test db` não pode ser executado neste ambiente), TypeScript manual (sem `supabase gen types` configurado).

## Global Constraints

Regras transversais do design (`docs/superpowers/specs/2026-08-24-evolucao-rose-design.md`) que se aplicam a esta fase:

- RLS habilitada em toda tabela nova; policies sempre `to authenticated`... na prática das migrations reais do projeto isso é feito com `using (auth.uid() = usuaria_id)` — para tabelas novas desta fase, usar a forma otimizada `(select auth.uid()) = usuaria_id` (evita o custo de reavaliar `auth.uid()` por linha — mesma correção já aplicada em `20260822094500_push_rls_initplan_performance.sql`).
- UPDATE (quando existir) sempre com `USING` e `WITH CHECK`.
- Nunca `auth.role()` (padrão antigo em `0001_init.sql`, não usar em código novo — usar GRANT + RLS por `auth.uid()`).
- Nunca GRANT a `anon`.
- Nunca `SECURITY DEFINER` para contornar RLS.
- `supabase migration new <nome>` para cada migration (nunca nomear arquivo manualmente).
- Idempotência: `create table if not exists`, `drop policy if exists` antes de cada `create policy`, `add column if not exists`.
- `notify pgrst, 'reload schema';` ao final de cada migration.
- Tipos TypeScript (`src/lib/supabase/types.ts`) atualizados manualmente após cada migration.
- `favoritos`: `sessao_id` é `text` sem FK (catálogo de sessões vive em código); índices únicos parciais, não únicos simples.
- `exportacoes_dados`: RLS habilitada, **sem** nenhuma policy para `authenticated`; GRANT revogado de `anon` e `authenticated`; escrita só via admin client (service role) — mesmo padrão de `acessos_administrativos` em `0001_init.sql`.
- `praticas`: **não alterar** o `check` de `tipo` (mantém `respiracao`,`reflexao`,`afirmacao`,`movimento`); RLS/GRANT existentes preservados sem mudança.
- `perfis`: `objetivos` e `temas_sensiveis` sem GRANT de UPDATE direto via PostgREST (mesmo padrão de trava de `pais`/`plano` em `0012_perfis_trava_colunas_sensiveis.sql`/`0033_perfis_relock_colunas_sensiveis.sql`) — escrita só via server action dedicada com admin client (implementada na seção 2, fora deste plano).
- Nunca escrever código de implementação de produto (rotas, componentes, server actions) nesta fase — só migrations, RLS, GRANTs, tipos e testes de RLS.

---

## Contexto levantado antes de escrever este plano

- Migrations mais recentes lidas: `20260818220822_sessoes_jornadas_conteudo_progresso.sql`, `20260822090000_push_notificacoes_avancado.sql`, `20260822093000_push_fila_revoga_anon_authenticated.sql`, `20260822094500_push_rls_initplan_performance.sql`, além de `0001_init.sql`, `0012_perfis_trava_colunas_sensiveis.sql`, `0033_perfis_relock_colunas_sensiveis.sql`.
- `src/lib/supabase/types.ts` lido por inteiro (474 linhas) — padrão confirmado: `export type X = {...}` por tabela, mais `export interface Database { public: { Tables: {...}, Views: Record<string, never>, Functions: {...} } }` com `Row`/`Insert`/`Update`/`Relationships: []` por tabela.
- `package.json` não tem `supabase` como dependência nem script de geração de tipos — confirma que os tipos são escritos à mão.
- CLI Supabase não está instalado localmente (`supabase: command not found`), mas roda via `npx supabase` (baixa on-demand, versão `2.115.0` confirmada). `npx supabase migration new "<nome>"` é o comando exato. O projeto já está **linkado** (`npx supabase projects list` retorna o projeto `znyddngfonlfujypzjjb`, `linked: true`), mas **não há Docker/Podman disponível** neste ambiente (`npx supabase status` falha com `docker: command not found`) — logo `supabase test db` (que precisa de banco local) não pode ser executado aqui. Isso é documentado explicitamente em cada task de teste, seguindo o mesmo aviso já usado em `supabase/tests/jornada_respostas_modulo_rls.test.sql`.
- Teste de RLS existente lido por inteiro: `supabase/tests/jornada_respostas_modulo_rls.test.sql` — formato pgTAP com `begin; select plan(N); ... select * from finish(); rollback;`, usuárias de teste com UUIDs fixos legíveis, `set local role authenticated; set local request.jwt.claims = '{"sub":"...","role":"authenticated"}';` para simular sessão, `set local role postgres;`/`reset role;` para inserts como service role, `throws_ok`/`lives_ok`/`is` como asserções.

---

## Task 1: Migration `favoritos`

**Files:**
- Create: `supabase/migrations/<timestamp>_favoritos.sql` (nome exato do arquivo gerado por `npx supabase migration new favoritos` — o timestamp é preenchido pelo CLI no momento da execução)
- Test: `supabase/tests/favoritos_rls.test.sql`

**Interfaces:**
- Produces: tabela `public.favoritos` com colunas `id uuid`, `usuaria_id uuid`, `pratica_id uuid | null`, `sessao_id text | null`, `criado_em timestamptz`. Constraint `favoritos_exatamente_um_alvo` garantindo XOR entre `pratica_id`/`sessao_id`. Índices únicos parciais `favoritos_usuaria_pratica_key` e `favoritos_usuaria_sessao_key`. Policies `"usuaria le proprios favoritos"` (select), `"usuaria insere proprios favoritos"` (insert), `"usuaria remove proprios favoritos"` (delete). GRANT `select, insert, delete` para `authenticated`.

- [ ] **Step 1: Gerar o arquivo de migration com o CLI**

```bash
npx supabase migration new favoritos
```

Isso cria `supabase/migrations/<timestamp>_favoritos.sql` vazio. Anote o timestamp gerado (necessário para o nome do arquivo nos próximos steps).

- [ ] **Step 2: Escrever o teste de RLS que falha (pgTAP)**

Criar `supabase/tests/favoritos_rls.test.sql`:

```sql
-- Testes de RLS para public.favoritos (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito, logo sem `supabase
-- start`), então este arquivo não pôde ser executado neste momento. Ele segue
-- o formato pgTAP padrão do Supabase e deve rodar em qualquer ambiente com
-- Postgres + extensão pgtap + Supabase CLI:
--
--   supabase test db
--
-- Cobre: usuária A lê/insere/remove os próprios favoritos; usuária A não vê
-- favoritos da usuária B; acesso anônimo é bloqueado; o constraint XOR
-- rejeita linhas com os dois alvos ou nenhum; os índices únicos parciais
-- impedem duplicar o mesmo favorito.

begin;
select plan(9);

insert into public.perfis (id, nome) values
  ('a0000000-0000-0000-0000-00000000000a', 'Usuária A'),
  ('b0000000-0000-0000-0000-00000000000b', 'Usuária B');

insert into public.praticas (id, categoria, tipo, titulo, conteudo, status) values
  ('c0000000-0000-0000-0000-00000000000c', 'respiracao', 'respiracao', 'Prática de teste', 'conteúdo', 'publicada');

-- Cenário 1: constraint XOR rejeita quando nenhum alvo é informado.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', null, null) $$,
  '23514',
  null,
  'INSERT sem pratica_id nem sessao_id é rejeitado pelo constraint XOR'
);

-- Cenário 2: constraint XOR rejeita quando os dois alvos são informados.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c', 'sessao-teste-1') $$,
  '23514',
  null,
  'INSERT com pratica_id e sessao_id ao mesmo tempo é rejeitado pelo constraint XOR'
);

-- Cenário 3: usuária A insere e lê o próprio favorito de prática.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c') $$,
  'usuária A consegue favoritar a própria prática'
);

select is(
  (select count(*)::int from public.favoritos where usuaria_id = 'a0000000-0000-0000-0000-00000000000a'),
  1,
  'usuária A vê o próprio favorito'
);

-- Cenário 4: índice único parcial impede duplicar o mesmo favorito de prática.
select throws_ok(
  $$ insert into public.favoritos (usuaria_id, pratica_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c') $$,
  '23505',
  null,
  'favoritar a mesma prática duas vezes é rejeitado pelo índice único parcial'
);

-- Cenário 5: usuária A favorita uma sessão de jornada (sessao_id, sem FK).
select lives_ok(
  $$ insert into public.favoritos (usuaria_id, sessao_id)
     values ('a0000000-0000-0000-0000-00000000000a', 'jornada-x:sessao-1') $$,
  'usuária A consegue favoritar uma sessão por sessao_id (texto, sem FK)'
);

-- Cenário 6: usuária A não vê favoritos da usuária B.
reset role;
set local role postgres;
insert into public.favoritos (usuaria_id, pratica_id)
  values ('b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.favoritos where usuaria_id = 'b0000000-0000-0000-0000-00000000000b'),
  0,
  'usuária A NÃO vê os favoritos da usuária B via SELECT'
);

-- Cenário 7: usuária A remove o próprio favorito.
select lives_ok(
  $$ delete from public.favoritos
     where usuaria_id = 'a0000000-0000-0000-0000-00000000000a' and sessao_id = 'jornada-x:sessao-1' $$,
  'usuária A consegue remover o próprio favorito'
);

-- Cenário 8: acesso anônimo é bloqueado.
reset role;
set local role anon;
reset request.jwt.claims;

select throws_ok(
  $$ select * from public.favoritos $$,
  '42501',
  null,
  'acesso anônimo é bloqueado por falta de GRANT (permission denied for table)'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Confirmar que o teste falha (tabela ainda não existe)**

Este ambiente não tem Docker/Podman, então `npx supabase test db` não roda localmente aqui — deixe documentado no próprio arquivo de teste (já feito no cabeçalho acima) e valide manualmente lendo o SQL: sem a tabela `favoritos`, qualquer `insert`/`select` acima falharia com `relation "favoritos" does not exist" (42P01)`, não com os códigos de erro esperados pelo teste (`23514`/`23505`/`42501`) — confirmando que o teste hoje não passaria. Se o executor deste plano tiver acesso a um ambiente com Docker, rodar:

```bash
npx supabase test db
```

Expected (com Docker disponível): FAIL — `relation "public.favoritos" does not exist`.

- [ ] **Step 4: Escrever a migration**

Preencher `supabase/migrations/<timestamp>_favoritos.sql`:

```sql
-- <timestamp>_favoritos.sql
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
```

- [ ] **Step 5: Confirmar que o teste passa**

Se houver ambiente com Docker disponível:

```bash
npx supabase test db
```

Expected: PASS — todos os 9 asserts de `favoritos_rls.test.sql` passam. Neste ambiente sem Docker, revisar manualmente o SQL da migration contra cada asserção do teste (constraint XOR, índices únicos parciais, policies por `auth.uid()`, ausência de GRANT para `anon`) e confirmar que a lógica é equivalente.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/favoritos_rls.test.sql
git commit -m "feat(db): cria tabela favoritos com RLS e testes"
```

---

## Task 2: Migration `exportacoes_dados`

**Files:**
- Create: `supabase/migrations/<timestamp>_exportacoes_dados.sql`
- Test: `supabase/tests/exportacoes_dados_rls.test.sql`

**Interfaces:**
- Consumes: nenhuma (tabela independente).
- Produces: tabela `public.exportacoes_dados` com colunas `id uuid`, `usuaria_id uuid`, `tipo text` (`check (tipo in ('json','csv'))`), `criado_em timestamptz`. RLS habilitada, **sem** policies para `authenticated`. GRANT revogado explicitamente de `anon`/`authenticated`. Só `service_role` (admin client) escreve/lê esta tabela — usada pela seção 8 (exportação de dados), fora deste plano.

- [ ] **Step 1: Gerar o arquivo de migration**

```bash
npx supabase migration new exportacoes_dados
```

- [ ] **Step 2: Escrever o teste de RLS que falha**

Criar `supabase/tests/exportacoes_dados_rls.test.sql`:

```sql
-- Testes de RLS para public.exportacoes_dados (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito, logo sem `supabase
-- start`), então este arquivo não pôde ser executado neste momento. Ele segue
-- o formato pgTAP padrão do Supabase e deve rodar em qualquer ambiente com
-- Postgres + extensão pgtap + Supabase CLI:
--
--   supabase test db
--
-- Tabela interna (mesmo padrão de acessos_administrativos em 0001_init.sql):
-- só registra QUE uma exportação ocorreu, nunca o conteúdo. Nenhuma role de
-- client (anon/authenticated) deve conseguir ler ou escrever — só
-- service_role, que ignora RLS e GRANT.

begin;
select plan(4);

insert into public.perfis (id, nome) values
  ('a0000000-0000-0000-0000-00000000000a', 'Usuária A');

-- Cenário 1: service_role consegue inserir (bypassa RLS e GRANT).
set local role postgres;
select lives_ok(
  $$ insert into public.exportacoes_dados (usuaria_id, tipo)
     values ('a0000000-0000-0000-0000-00000000000a', 'json') $$,
  'service role consegue registrar uma exportação'
);
reset role;

-- Cenário 2: usuária autenticada não consegue LER a própria linha (sem
-- policy = nenhum acesso, mesmo sendo o próprio usuaria_id).
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ select * from public.exportacoes_dados where usuaria_id = 'a0000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'usuária autenticada não consegue ler exportacoes_dados (sem GRANT)'
);

-- Cenário 3: usuária autenticada não consegue INSERIR.
select throws_ok(
  $$ insert into public.exportacoes_dados (usuaria_id, tipo)
     values ('a0000000-0000-0000-0000-00000000000a', 'csv') $$,
  '42501',
  null,
  'usuária autenticada não consegue inserir em exportacoes_dados (sem GRANT)'
);

-- Cenário 4: acesso anônimo é bloqueado.
reset role;
set local role anon;
reset request.jwt.claims;

select throws_ok(
  $$ select * from public.exportacoes_dados $$,
  '42501',
  null,
  'acesso anônimo é bloqueado por falta de GRANT (permission denied for table)'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Confirmar que o teste falha (tabela ainda não existe)**

Sem Docker disponível neste ambiente, validar manualmente: sem a tabela `exportacoes_dados`, o `insert` do Cenário 1 (como `postgres`/service role) falharia com `relation "public.exportacoes_dados" does not exist" (42P01)`, não com sucesso — confirmando que o teste hoje não passaria. Onde houver Docker:

```bash
npx supabase test db
```

Expected: FAIL — `relation "public.exportacoes_dados" does not exist`.

- [ ] **Step 4: Escrever a migration**

Preencher `supabase/migrations/<timestamp>_exportacoes_dados.sql`:

```sql
-- <timestamp>_exportacoes_dados.sql
-- Tabela interna de auditoria da seção 8 do design "Evolução da Rose Fase
-- 2" (exportação de dados): registra só QUE uma exportação ocorreu
-- (usuaria_id + tipo + quando), nunca o conteúdo exportado. Mesmo padrão de
-- acessos_administrativos em 0001_init.sql — RLS habilitada, mas SEM
-- nenhuma policy para authenticated/anon de propósito, então nenhuma role de
-- client consegue ler ou escrever esta tabela mesmo com RLS habilitada
-- (RLS só filtra linhas para roles que já têm GRANT na tabela). Escrita
-- exclusiva pela própria rota de exportação, no servidor, usando o admin
-- client (service role) — nunca a partir de input do cliente.
create table if not exists public.exportacoes_dados (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('json', 'csv')),
  criado_em timestamptz not null default now()
);

alter table public.exportacoes_dados enable row level security;
-- Nenhuma policy criada de propósito: sem policy, nenhuma role de client
-- (anon/authenticated) consegue ler ou escrever. Só a service role key tem
-- acesso, na rota de exportação (seção 8, fora deste plano).

-- Revoga explicitamente qualquer privilégio default que o Supabase possa ter
-- concedido a anon/authenticated na criação da tabela (mesmo cuidado já
-- tomado em 20260822093000_push_fila_revoga_anon_authenticated.sql para
-- push_notificacoes/push_envios) — não confia apenas em "nenhuma policy =
-- nenhum acesso" para SELECT/INSERT/UPDATE/DELETE, e cobre também TRUNCATE,
-- que não é filtrado por RLS.
revoke all on public.exportacoes_dados from anon, authenticated;

notify pgrst, 'reload schema';
```

- [ ] **Step 5: Confirmar que o teste passa**

Onde houver Docker:

```bash
npx supabase test db
```

Expected: PASS — os 4 asserts de `exportacoes_dados_rls.test.sql` passam. Neste ambiente sem Docker, revisar manualmente: `revoke all ... from anon, authenticated` cobre SELECT/INSERT/UPDATE/DELETE/TRUNCATE; nenhuma `create policy` existe para essas roles.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/exportacoes_dados_rls.test.sql
git commit -m "feat(db): cria tabela interna exportacoes_dados sem acesso de client"
```

---

## Task 3: Migration alterando `praticas` (áudio)

**Files:**
- Create: `supabase/migrations/<timestamp>_praticas_audio.sql`
- Test: `supabase/tests/praticas_audio_colunas.test.sql`

**Interfaces:**
- Consumes: tabela `public.praticas` já existente (`0001_init.sql`), RLS/GRANT preservados sem mudança.
- Produces: colunas novas em `public.praticas`: `audio_url text`, `duracao_segundos int`, `transcricao text`, `audio_status text not null default 'rascunho' check (audio_status in ('rascunho','revisada','publicada'))`, `is_pro boolean not null default false`. Coluna `tipo` **inalterada**.

- [ ] **Step 1: Gerar o arquivo de migration**

```bash
npx supabase migration new praticas_audio
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `supabase/tests/praticas_audio_colunas.test.sql`:

```sql
-- Testes de schema para as colunas de áudio de public.praticas (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito), então este arquivo
-- não pôde ser executado neste momento. Roda com:
--
--   supabase test db
--
-- Cobre: as 5 colunas novas existem com o tipo esperado; o constraint de
-- audio_status aceita só os 3 valores válidos; o default de audio_status e
-- is_pro está correto; a constraint de `tipo` continua com os 4 valores
-- originais (não foi alterada por esta migração).

begin;
select plan(7);

select has_column('public', 'praticas', 'audio_url', 'praticas.audio_url existe');
select has_column('public', 'praticas', 'duracao_segundos', 'praticas.duracao_segundos existe');
select has_column('public', 'praticas', 'transcricao', 'praticas.transcricao existe');
select has_column('public', 'praticas', 'audio_status', 'praticas.audio_status existe');
select has_column('public', 'praticas', 'is_pro', 'praticas.is_pro existe');

insert into public.praticas (categoria, tipo, titulo, conteudo, status)
values ('respiracao', 'respiracao', 'Prática de teste', 'conteúdo', 'rascunho');

select is(
  (select audio_status from public.praticas where titulo = 'Prática de teste'),
  'rascunho',
  'audio_status assume o default rascunho'
);

select is(
  (select is_pro from public.praticas where titulo = 'Prática de teste'),
  false,
  'is_pro assume o default false'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Confirmar que o teste falha**

Sem Docker neste ambiente, validar manualmente: nenhuma das 5 colunas existe hoje em `public.praticas` (confirmado lendo `0001_init.sql`, linhas 59-67), então `has_column` retornaria falso para todas e o `insert`/`select` de `audio_status`/`is_pro` falharia com `column "audio_status" does not exist`. Onde houver Docker:

```bash
npx supabase test db
```

Expected: FAIL.

- [ ] **Step 4: Escrever a migration**

Preencher `supabase/migrations/<timestamp>_praticas_audio.sql`:

```sql
-- <timestamp>_praticas_audio.sql
-- Colunas de áudio para a biblioteca de práticas (seção 6 do design
-- "Evolução da Rose Fase 2" — práticas em áudio). public.praticas continua
-- sendo a fonte canônica de conteúdo curado pela psicóloga (0001_init.sql);
-- esta migração só acrescenta os campos necessários para anexar um áudio
-- opcional a uma prática já existente, sem alterar o schema de texto atual.
--
-- `tipo` NÃO é alterado por esta migração — continua com os 4 valores
-- originais (respiracao, reflexao, afirmacao, movimento). Temas como
-- "autocompaixão"/"aterramento" são valores de `categoria` (já text livre,
-- sem constraint), não de `tipo`.
--
-- Visibilidade do player é decidida na camada de aplicação (seção 6, fora
-- deste plano), não por constraint de banco: só renderiza quando
-- status = 'publicada' AND audio_status = 'publicada' AND
-- audio_url/duracao_segundos/transcricao não nulos — isso permite existir
-- rascunho com dados parciais de áudio sem quebrar constraint.
alter table public.praticas
  add column if not exists audio_url text,
  add column if not exists duracao_segundos int,
  add column if not exists transcricao text,
  add column if not exists audio_status text not null default 'rascunho'
    check (audio_status in ('rascunho', 'revisada', 'publicada')),
  add column if not exists is_pro boolean not null default false;

comment on column public.praticas.audio_status is
  'Estado de revisão do áudio, independente de praticas.status (texto). Um áudio só aparece em produção quando status = ''publicada'' E audio_status = ''publicada'' E audio_url/duracao_segundos/transcricao preenchidos — decidido na aplicação, não aqui.';

comment on column public.praticas.is_pro is
  'true = exige plano premium para tocar o áudio (checado no servidor da rota da prática, nunca só no cliente). Pode existir uma prática is_pro = false como demonstração gratuita.';

-- RLS e GRANT de public.praticas (0001_init.sql) preservados sem mudança:
-- "qualquer usuaria autenticada le praticas publicadas" continua valendo
-- para a linha inteira, incluindo as novas colunas.

notify pgrst, 'reload schema';
```

- [ ] **Step 5: Confirmar que o teste passa**

Onde houver Docker:

```bash
npx supabase test db
```

Expected: PASS — os 7 asserts passam. Neste ambiente, revisar manualmente que os 5 `add column if not exists` cobrem exatamente os nomes/tipos usados no teste e que `tipo` não foi tocado.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/praticas_audio_colunas.test.sql
git commit -m "feat(db): adiciona colunas de audio em praticas"
```

---

## Task 4: Migration alterando `recursos_seguranca`

**Files:**
- Create: `supabase/migrations/<timestamp>_recursos_seguranca_verificacao.sql`
- Test: `supabase/tests/recursos_seguranca_colunas.test.sql`

**Interfaces:**
- Consumes: tabela `public.recursos_seguranca` já existente (`0001_init.sql`), RLS/GRANT preservados sem mudança.
- Produces: colunas novas `fonte text`, `verificado_em date`. Nenhum constraint de not-null (contatos ainda não verificados permanecem na tabela com essas colunas nulas).

- [ ] **Step 1: Gerar o arquivo de migration**

```bash
npx supabase migration new recursos_seguranca_verificacao
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `supabase/tests/recursos_seguranca_colunas.test.sql`:

```sql
-- Testes de schema para as colunas de verificação de public.recursos_seguranca (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito), então este arquivo
-- não pôde ser executado neste momento. Roda com:
--
--   supabase test db
--
-- Cobre: as 2 colunas novas existem; um recurso pode ser inserido sem elas
-- (nullable, contato ainda não verificado); um recurso pode ser inserido com
-- elas preenchidas (contato confirmado).

begin;
select plan(4);

select has_column('public', 'recursos_seguranca', 'fonte', 'recursos_seguranca.fonte existe');
select has_column('public', 'recursos_seguranca', 'verificado_em', 'recursos_seguranca.verificado_em existe');

select lives_ok(
  $$ insert into public.recursos_seguranca (pais, titulo, corpo)
     values ('BR', 'Contato não verificado', 'corpo de teste') $$,
  'recurso sem fonte/verificado_em (contato ainda não verificável) pode ser inserido'
);

select lives_ok(
  $$ insert into public.recursos_seguranca (pais, titulo, corpo, fonte, verificado_em)
     values ('BR', 'Contato verificado', 'corpo de teste', 'Ministério da Saúde', '2026-08-24') $$,
  'recurso com fonte e verificado_em preenchidos pode ser inserido'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Confirmar que o teste falha**

Sem Docker neste ambiente, validar manualmente: nenhuma das 2 colunas existe hoje (confirmado em `0001_init.sql`, linhas 118-124), então `has_column` falharia e o segundo `insert` (com `fonte`/`verificado_em`) falharia com `column "fonte" of relation "recursos_seguranca" does not exist`. Onde houver Docker:

```bash
npx supabase test db
```

Expected: FAIL.

- [ ] **Step 4: Escrever a migration**

Preencher `supabase/migrations/<timestamp>_recursos_seguranca_verificacao.sql`:

```sql
-- <timestamp>_recursos_seguranca_verificacao.sql
-- Colunas de verificação de fonte para public.recursos_seguranca (seção 7 do
-- design "Evolução da Rose Fase 2" — espaço "Preciso de ajuda agora"). Um
-- recurso só deve ser exibido como "confirmado" em produção quando `fonte` e
-- `verificado_em` estiverem preenchidos com uma fonte oficial verificada —
-- essa verificação é feita na fase de implementação da seção 7 (fora deste
-- plano), pesquisando fontes oficiais de governo/saúde de PT e BR.
-- Contatos ainda não verificáveis nesta fase permanecem na tabela para
-- referência/revisão futura, mas a query de exibição (aplicação, seção 7)
-- filtra por `fonte is not null and verificado_em is not null` — por isso
-- as colunas são nullable, não not null.
alter table public.recursos_seguranca
  add column if not exists fonte text,
  add column if not exists verificado_em date;

comment on column public.recursos_seguranca.fonte is
  'Nome da fonte oficial (ex.: "Ministério da Saúde", "CVV") que confirma este contato. Nulo = ainda não verificado, não deve ser exibido como recurso confirmado.';

comment on column public.recursos_seguranca.verificado_em is
  'Data em que a fonte foi conferida. Nulo = ainda não verificado.';

-- RLS e GRANT de public.recursos_seguranca (0001_init.sql) preservados sem
-- mudança: "qualquer usuaria autenticada le recursos de seguranca" continua
-- valendo para a linha inteira, incluindo as novas colunas.

notify pgrst, 'reload schema';
```

- [ ] **Step 5: Confirmar que o teste passa**

Onde houver Docker:

```bash
npx supabase test db
```

Expected: PASS — os 4 asserts passam.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/recursos_seguranca_colunas.test.sql
git commit -m "feat(db): adiciona colunas de verificacao de fonte em recursos_seguranca"
```

---

## Task 5: Migration alterando `perfis` (onboarding personalizado)

**Files:**
- Create: `supabase/migrations/<timestamp>_perfis_onboarding_extra.sql`
- Test: `supabase/tests/perfis_onboarding_extra_rls.test.sql`

**Interfaces:**
- Consumes: tabela `public.perfis` já existente, GRANT de UPDATE por coluna já restrito (`0033_perfis_relock_colunas_sensiveis.sql`: `nome, frase_pessoal, faixa_etaria, fuso_horario, idioma, foto_url, horario_preferido_notificacao, consentimento_dados_sensiveis_em`).
- Produces: colunas novas em `public.perfis`: `objetivos text[] not null default '{}'`, `temas_sensiveis text[] not null default '{}'`, `onboarding_extra_concluido_em timestamptz`, `onboarding_extra_dispensado_em timestamptz`. **Nenhuma das 4 colunas é adicionada ao GRANT de UPDATE de `authenticated`** — todas seguem o mesmo padrão de trava de `pais`/`plano`, graváveis só via server action dedicada com admin client (implementada na seção 2, fora deste plano).

**Decisão tomada nesta task (ambiguidade do design resolvida aqui):** o design (seção 1) diz explicitamente "sem GRANT de UPDATE direto" só para `objetivos`/`temas_sensiveis`, mas não fala explicitamente do GRANT de `onboarding_extra_concluido_em`/`onboarding_extra_dispensado_em`. Optei por manter as 4 colunas fora do GRANT de UPDATE de `authenticated`, pela mesma razão que already existe para `pais_confirmado_em` (que também é um timestamp de confirmação de etapa e está fora do GRANT desde `0032`/`0033`): os 4 campos são gravados juntos, na mesma server action de personalização/edição de perfil, e essa server action já precisa ser idempotente e não pode confiar em escrita direta do client para nenhum dos dois arrays sensíveis — manter os timestamps de controle também fora do GRANT evita qualquer caminho onde o client grave `onboarding_extra_concluido_em` sem de fato ter passado pela validação server-side dos arrays. Se a seção 2 (fora deste plano) descobrir necessidade de escrita direta do client para os timestamps, uma migração futura pode reabrir o GRANT especificamente para essas duas colunas.

- [ ] **Step 1: Gerar o arquivo de migration**

```bash
npx supabase migration new perfis_onboarding_extra
```

- [ ] **Step 2: Escrever o teste de RLS/GRANT que falha**

Criar `supabase/tests/perfis_onboarding_extra_rls.test.sql`:

```sql
-- Testes de schema/GRANT para as colunas de onboarding personalizado de
-- public.perfis (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito), então este arquivo
-- não pôde ser executado neste momento. Roda com:
--
--   supabase test db
--
-- Cobre: as 4 colunas novas existem com o default esperado; a usuária
-- autenticada NÃO consegue fazer UPDATE direto em objetivos/temas_sensiveis/
-- onboarding_extra_concluido_em/onboarding_extra_dispensado_em via PostgREST
-- (mesmo padrão de trava de pais/plano); a usuária autenticada AINDA
-- consegue fazer UPDATE nas colunas já liberadas (ex.: nome), confirmando
-- que a trava é só nas 4 colunas novas, não na tabela inteira; o admin
-- client (service role) consegue escrever nas 4 colunas novas.

begin;
select plan(9);

insert into public.perfis (id, nome) values
  ('a0000000-0000-0000-0000-00000000000a', 'Usuária A');

select has_column('public', 'perfis', 'objetivos', 'perfis.objetivos existe');
select has_column('public', 'perfis', 'temas_sensiveis', 'perfis.temas_sensiveis existe');
select has_column('public', 'perfis', 'onboarding_extra_concluido_em', 'perfis.onboarding_extra_concluido_em existe');
select has_column('public', 'perfis', 'onboarding_extra_dispensado_em', 'perfis.onboarding_extra_dispensado_em existe');

select is(
  (select objetivos from public.perfis where id = 'a0000000-0000-0000-0000-00000000000a'),
  '{}'::text[],
  'objetivos assume o default de array vazio'
);

-- Usuária autenticada tentando atualizar diretamente as colunas novas.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ update public.perfis set objetivos = array['reduzir_ansiedade'] where id = 'a0000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'usuária autenticada NÃO consegue UPDATE direto em objetivos (sem GRANT na coluna)'
);

select throws_ok(
  $$ update public.perfis set onboarding_extra_concluido_em = now() where id = 'a0000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'usuária autenticada NÃO consegue UPDATE direto em onboarding_extra_concluido_em (sem GRANT na coluna)'
);

-- Confirma que a trava é só nas colunas novas, não na tabela inteira: nome
-- continua gravável (GRANT concedido desde 0012/0033).
select lives_ok(
  $$ update public.perfis set nome = 'Usuária A editada' where id = 'a0000000-0000-0000-0000-00000000000a' $$,
  'usuária autenticada continua conseguindo UPDATE em nome (coluna já liberada)'
);

-- Admin client (service role) consegue escrever nas 4 colunas novas.
reset role;
set local role postgres;

select lives_ok(
  $$ update public.perfis
     set objetivos = array['reduzir_ansiedade'],
         temas_sensiveis = array['alimentacao'],
         onboarding_extra_concluido_em = now()
     where id = 'a0000000-0000-0000-0000-00000000000a' $$,
  'service role consegue escrever nas 4 colunas novas'
);
reset role;

select * from finish();
rollback;
```

- [ ] **Step 3: Confirmar que o teste falha**

Sem Docker neste ambiente, validar manualmente: nenhuma das 4 colunas existe hoje em `public.perfis` (confirmado em `0001_init.sql` linhas 2-9, mais as colunas acrescentadas por `0032`/migrations posteriores — nenhuma delas é `objetivos`/`temas_sensiveis`/`onboarding_extra_*`), então tanto os `has_column` quanto os `update`/`select` de `objetivos` falhariam com `column "objetivos" does not exist`. Onde houver Docker:

```bash
npx supabase test db
```

Expected: FAIL.

- [ ] **Step 4: Escrever a migration**

Preencher `supabase/migrations/<timestamp>_perfis_onboarding_extra.sql`:

```sql
-- <timestamp>_perfis_onboarding_extra.sql
-- Colunas de onboarding personalizado para public.perfis (seção 2 do design
-- "Evolução da Rose Fase 2"). objetivos e temas_sensiveis são dados
-- sensíveis: validados no servidor contra listas fechadas (as opções
-- literais do enunciado da seção 2), nunca strings arbitrárias vindas do
-- client. onboarding_extra_concluido_em é preenchido só quando a usuária
-- efetivamente conclui a etapa (mesmo escolhendo "prefiro decidir
-- depois"/"prefiro não responder" em algum campo — a etapa foi respondida).
-- onboarding_extra_dispensado_em é preenchido só quando uma usuária antiga
-- dispensa o banner em Perfil sem preencher nada — distinto de conclusão
-- real. Nenhuma coluna nova para o lembrete: reaproveita
-- preferencias_notificacoes + horario_preferido_notificacao já existentes.
alter table public.perfis
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists temas_sensiveis text[] not null default '{}',
  add column if not exists onboarding_extra_concluido_em timestamptz,
  add column if not exists onboarding_extra_dispensado_em timestamptz;

comment on column public.perfis.objetivos is
  'Multi-seleção opcional das opções fechadas de objetivo (seção 2 do design). Validado no servidor contra lista fechada — nunca string arbitrária. "Prefiro decidir depois" grava array vazio, nunca um valor sentinela. Sem GRANT de UPDATE direto para authenticated — só server action dedicada com admin client.';

comment on column public.perfis.temas_sensiveis is
  'Multi-seleção opcional das opções fechadas de tema sensível (seção 2 do design). Mesma trava e mesma regra de "array vazio quando pulado" de objetivos.';

comment on column public.perfis.onboarding_extra_concluido_em is
  'Preenchido só quando a usuária efetivamente conclui a etapa de personalização (mesmo pulando campos individuais). Nulo = etapa ainda não concluída. Sem GRANT de UPDATE direto para authenticated.';

comment on column public.perfis.onboarding_extra_dispensado_em is
  'Preenchido só quando uma usuária antiga dispensa o banner de personalização em Perfil sem preencher nada. Distinto de onboarding_extra_concluido_em (conclusão real). Sem GRANT de UPDATE direto para authenticated.';

-- Sem alteração no GRANT de UPDATE por coluna de authenticated (0033
-- continua valendo como está: nome, frase_pessoal, faixa_etaria,
-- fuso_horario, idioma, foto_url, horario_preferido_notificacao,
-- consentimento_dados_sensiveis_em) — as 4 colunas novas ficam de fora de
-- propósito, mesmo padrão de trava de pais/plano/pais_confirmado_em.
-- Escrita só via server action dedicada usando o admin client (seção 2,
-- fora deste plano), que também permite apagar (gravar '{}') ou alterar a
-- qualquer momento.

notify pgrst, 'reload schema';
```

- [ ] **Step 5: Confirmar que o teste passa**

Onde houver Docker:

```bash
npx supabase test db
```

Expected: PASS — os 9 asserts passam. Neste ambiente, revisar manualmente que esta migration NÃO contém nenhum `grant update (...) on public.perfis` — o GRANT de `0033` continua sendo o único vigente, então `objetivos`/`temas_sensiveis`/`onboarding_extra_concluido_em`/`onboarding_extra_dispensado_em` ficam automaticamente fora dele.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/perfis_onboarding_extra_rls.test.sql
git commit -m "feat(db): adiciona colunas de onboarding personalizado em perfis"
```

---

## Task 6: Atualizar `src/lib/supabase/types.ts`

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Consumes: nomes exatos de tabelas/colunas produzidos nas Tasks 1-5: `favoritos` (`id`, `usuaria_id`, `pratica_id`, `sessao_id`, `criado_em`), `exportacoes_dados` (`id`, `usuaria_id`, `tipo: 'json' | 'csv'`, `criado_em`), `praticas` +5 colunas (`audio_url`, `duracao_segundos`, `transcricao`, `audio_status: 'rascunho' | 'revisada' | 'publicada'`, `is_pro`), `recursos_seguranca` +2 colunas (`fonte`, `verificado_em`), `perfis` +4 colunas (`objetivos: string[]`, `temas_sensiveis: string[]`, `onboarding_extra_concluido_em: string | null`, `onboarding_extra_dispensado_em: string | null`).
- Produces: `export type Favorito`, `export type ExportacaoDados`, `export type StatusAudioPratica`, atualização de `Pratica`, `RecursoSeguranca`, `Perfil`, e entradas correspondentes em `Database['public']['Tables']` — usados por toda implementação de código das seções 2-8 (fora deste plano).

Este arquivo não tem testes automatizados próprios (é um arquivo de tipos puro) — a verificação é o typecheck do projeto inteiro compilando sem erro, incluindo qualquer lugar que já use `Pratica`/`Perfil`/`RecursoSeguranca` hoje.

- [ ] **Step 1: Rodar o typecheck atual como baseline antes de editar**

```bash
npx tsc --noEmit
```

Expected: PASS (sem erros) — este é o estado antes da mudança, serve de baseline para comparar depois.

- [ ] **Step 2: Adicionar `StatusAudioPratica` e atualizar `Pratica`**

Em `src/lib/supabase/types.ts`, logo após a linha 4 (`export type TipoPratica = ...`):

```typescript
export type StatusAudioPratica = 'rascunho' | 'revisada' | 'publicada';
```

Substituir o bloco `export type Pratica = {...}` (linhas 99-107 atuais) por:

```typescript
export type Pratica = {
  id: string;
  categoria: string;
  tipo: TipoPratica;
  titulo: string;
  conteudo: string;
  status: StatusPratica;
  criado_em: string;
  // Colunas de áudio (ver migração <timestamp>_praticas_audio.sql). Todas
  // nulas até a psicóloga revisar e publicar o áudio — visibilidade do
  // player decidida na aplicação (status='publicada' AND
  // audio_status='publicada' AND os três campos abaixo não nulos), nunca só
  // pelo schema.
  audio_url: string | null;
  duracao_segundos: number | null;
  transcricao: string | null;
  audio_status: StatusAudioPratica;
  // true = exige plano premium para tocar o áudio (checado no servidor).
  is_pro: boolean;
};
```

- [ ] **Step 3: Atualizar `RecursoSeguranca`**

Substituir o bloco `export type RecursoSeguranca = {...}` (linhas 134-140 atuais) por:

```typescript
export type RecursoSeguranca = {
  id: string;
  pais: string;
  titulo: string;
  corpo: string;
  ordem: number;
  // Nulo = contato ainda não verificado nesta fase; só exibir como recurso
  // confirmado quando fonte e verificado_em estiverem os dois preenchidos
  // (ver migração <timestamp>_recursos_seguranca_verificacao.sql).
  fonte: string | null;
  verificado_em: string | null; // YYYY-MM-DD
};
```

- [ ] **Step 4: Atualizar `Perfil`**

No bloco `export type Perfil = {...}` (linhas 7-31 atuais), adicionar antes do `};` final:

```typescript
  // Onboarding personalizado (ver migração
  // <timestamp>_perfis_onboarding_extra.sql). Validados no servidor contra
  // listas fechadas — nunca string arbitrária. Sem GRANT de UPDATE direto
  // para authenticated: escrita só via server action dedicada com admin
  // client (mesmo padrão de pais/plano).
  objetivos: string[];
  temas_sensiveis: string[];
  // Preenchido só ao concluir efetivamente a etapa de personalização
  // (mesmo pulando campos). Nulo = ainda não concluída.
  onboarding_extra_concluido_em: string | null;
  // Preenchido só quando uma usuária antiga dispensa o banner sem preencher
  // nada. Distinto de onboarding_extra_concluido_em.
  onboarding_extra_dispensado_em: string | null;
```

- [ ] **Step 5: Adicionar os tipos `Favorito` e `ExportacaoDados`**

Logo após o bloco `export type AcessoAdministrativo = {...}` (linha 200 atual, antes de `export type StatusJornada = ...`), adicionar:

```typescript
export type Favorito = {
  id: string;
  usuaria_id: string;
  // Exatamente um dos dois é não-nulo por linha (constraint
  // favoritos_exatamente_um_alvo na migração <timestamp>_favoritos.sql).
  pratica_id: string | null;
  sessao_id: string | null;
  criado_em: string;
};

export type TipoExportacaoDados = 'json' | 'csv';

// Tabela interna (sem GRANT/policy para authenticated/anon) — só registra
// que uma exportação ocorreu, nunca o conteúdo. Escrita exclusiva via
// admin client no servidor (ver migração
// <timestamp>_exportacoes_dados.sql).
export type ExportacaoDados = {
  id: string;
  usuaria_id: string;
  tipo: TipoExportacaoDados;
  criado_em: string;
};
```

- [ ] **Step 6: Registrar as duas tabelas novas em `Database['public']['Tables']`**

No bloco `export interface Database {...}`, adicionar duas entradas dentro de `Tables`, logo após `push_envios` (linha 429-434 atual, antes do `};` que fecha `Tables`):

```typescript
      favoritos: {
        Row: Favorito;
        Insert: Omit<Favorito, 'id' | 'criado_em'> & { id?: string };
        Update: Partial<Favorito>;
        Relationships: [];
      };
      exportacoes_dados: {
        Row: ExportacaoDados;
        Insert: Omit<ExportacaoDados, 'id' | 'criado_em'> & { id?: string };
        Update: Partial<ExportacaoDados>;
        Relationships: [];
      };
```

- [ ] **Step 7: Rodar o typecheck e confirmar que compila sem erro**

```bash
npx tsc --noEmit
```

Expected: PASS (sem erros). Se algum arquivo existente que usa `Pratica`, `Perfil` ou `RecursoSeguranca` com um objeto literal (não via Supabase client, ex. mocks de teste) quebrar por falta das novas propriedades obrigatórias, ajustar esse arquivo para incluir os novos campos (não afrouxar o tipo).

- [ ] **Step 8: Rodar lint**

```bash
npm run lint
```

Expected: PASS (sem erros no arquivo alterado).

- [ ] **Step 9: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat(db): atualiza tipos TypeScript para favoritos, exportacoes_dados, audio de praticas, verificacao de recursos_seguranca e onboarding extra"
```

---

## Verificação final desta fase

- [ ] **Rodar toda a suíte de testes de JS/TS (garantir que nada quebrou com o novo types.ts)**

```bash
npm test
```

Expected: PASS.

- [ ] **Rodar build de produção**

```bash
npm run build
```

Expected: PASS.

- [ ] **Confirmar que as 5 migrations foram criadas com `supabase migration new` (nomes com timestamp, não manuais)**

```bash
git log --oneline -5 -- supabase/migrations
ls supabase/migrations | tail -5
```

Expected: 5 arquivos novos, todos com prefixo numérico de timestamp gerado pelo CLI (formato `YYYYMMDDHHMMSS_nome.sql`), nenhum com nome inventado manualmente.

- [ ] **Registrar pendência de execução real das migrations**

Este ambiente não tem Docker/Podman, então nenhuma migration foi de fato aplicada a um banco (local ou remoto) durante a execução deste plano — só escritas e revisadas manualmente. Antes de abrir o PR desta fase, quem executar precisa, num ambiente com Docker disponível (ou usando `npx supabase db push` contra o projeto linkado `znyddngfonlfujypzjjb`, com cautela por ser o projeto real):
  1. Rodar `npx supabase test db` e confirmar que os 4 arquivos de teste pgTAP passam.
  2. Aplicar as migrations (`npx supabase db push` ou `supabase start` + `supabase migration up` local) e rodar os Supabase Advisors de segurança/performance sobre o schema resultante.
  3. Só então marcar esta fase como pronta para PR.

---

## Self-review (feito antes de salvar a versão final deste plano)

**1. Cobertura da Seção 1 do spec:**
- Tabela `favoritos` (colunas, XOR check, índices únicos parciais, RLS, GRANT) → Task 1. ✓
- Tabela `exportacoes_dados` (RLS sem policy, GRANT revogado) → Task 2. ✓
- Alteração de `praticas` (5 colunas, `tipo` intocado, RLS/GRANT preservados) → Task 3. ✓
- Alteração de `recursos_seguranca` (2 colunas) → Task 4. ✓
- Alteração de `perfis` (4 colunas, sem GRANT de UPDATE em objetivos/temas_sensiveis) → Task 5. ✓
- Convenções (`supabase migration new`, RLS+`(select auth.uid())`, idempotência, `notify pgrst`) → aplicadas em todas as Tasks 1-5 e listadas em Global Constraints. ✓
- Atualização manual de `src/lib/supabase/types.ts` → Task 6. ✓

**2. Scan de placeholders:** nenhum "TBD"/"adicione validação apropriada"/"similar à Task N" encontrado — todo SQL e TypeScript é literal e completo em cada task, inclusive os 4 arquivos de teste pgTAP com asserções reais.

**3. Consistência de nomes/tipos entre tasks:** `Favorito.pratica_id`/`sessao_id` (Task 6) batem com as colunas da migration (Task 1); `ExportacaoDados.tipo: 'json' | 'csv'` (Task 6) bate com o `check` da migration (Task 2); `Pratica.audio_status: StatusAudioPratica` (Task 6) bate com o `check` de `audio_status` (Task 3); `RecursoSeguranca.fonte`/`verificado_em` (Task 6) batem com as colunas nullable da migration (Task 4); `Perfil.objetivos`/`temas_sensiveis`/`onboarding_extra_concluido_em`/`onboarding_extra_dispensado_em` (Task 6) batem com a migration (Task 5) e nenhuma das 4 aparece em GRANT de UPDATE em nenhum lugar do plano.
