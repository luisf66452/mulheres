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

-- public.perfis.id referencia auth.users(id) com FK obrigatória (não
-- deferrable) e um trigger (on_auth_user_created, 0001_init.sql) já cria a
-- linha em public.perfis automaticamente ao inserir em auth.users — por
-- isso o fixture insere em auth.users (não em perfis diretamente) e só
-- ajusta o nome depois via UPDATE.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'usuaria-a@teste.rose.local', 'senha-nao-usada-neste-teste', now(), now(), now(), 'authenticated', 'authenticated');

update public.perfis set nome = 'Usuária A' where id = 'a0000000-0000-0000-0000-00000000000a';

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
