-- Testes de RLS para public.jornada_respostas_modulo (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito, logo sem `supabase
-- start`), então este arquivo não pôde ser executado neste momento. Ele segue
-- o formato pgTAP padrão do Supabase e deve rodar em qualquer ambiente com
-- Postgres + extensão pgtap + Supabase CLI:
--
--   supabase test db
--
-- (ou `supabase db test` dependendo da versão do CLI). Cobre os 4 cenários
-- exigidos: usuária A lê os próprios dados; usuária A não lê dados da
-- usuária B; acesso anônimo é bloqueado; INSERT tentando falsificar
-- user_id de outra pessoa é rejeitado.

begin;
select plan(8);

-- Duas usuárias de teste, cada uma com sua própria jornada em andamento.
--
-- public.perfis.id referencia auth.users(id) com FK obrigatória (não
-- deferrable) e um trigger (on_auth_user_created, 0001_init.sql) já cria a
-- linha em public.perfis automaticamente ao inserir em auth.users — por
-- isso o fixture insere em auth.users (não em perfis diretamente) e só
-- ajusta o nome depois via UPDATE.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'usuaria-a@teste.rose.local', 'senha-nao-usada-neste-teste', now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-00000000000b', 'usuaria-b@teste.rose.local', 'senha-nao-usada-neste-teste', now(), now(), now(), 'authenticated', 'authenticated');

update public.perfis set nome = 'Usuária A' where id = 'a0000000-0000-0000-0000-00000000000a';
update public.perfis set nome = 'Usuária B' where id = 'b0000000-0000-0000-0000-00000000000b';

insert into public.jornadas (id, titulo, descricao, duracao_dias, status) values
  ('c0000000-0000-0000-0000-00000000000c', 'Jornada de teste RLS', 'desc', 7, 'publicada');

insert into public.jornada_atividades (id, jornada_id, numero_dia, titulo, conteudo) values
  ('d0000000-0000-0000-0000-00000000000d', 'c0000000-0000-0000-0000-00000000000c', 1, 'Dia 1', 'conteúdo');

insert into public.jornadas_usuarias (id, usuaria_id, jornada_id) values
  ('e0000000-0000-0000-0000-00000000000e', 'a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c'),
  ('f0000000-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c');

-- Como service role (bypassa RLS), cria a resposta da usuária A para servir de
-- alvo aos testes de leitura abaixo.
set local role postgres;
insert into public.jornada_respostas_modulo
  (id, user_id, jornada_usuario_id, atividade_id, schema_version, respostas)
values (
  '11111111-2222-3333-4444-555555555555',
  'a0000000-0000-0000-0000-00000000000a',
  'e0000000-0000-0000-0000-00000000000e',
  'd0000000-0000-0000-0000-00000000000d',
  1,
  '{"situacao": "texto de teste"}'::jsonb
);
reset role;

-- Cenário 1: usuária A acessando os próprios dados.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.jornada_respostas_modulo where user_id = 'a0000000-0000-0000-0000-00000000000a'),
  1,
  'usuária A vê a própria resposta'
);

select lives_ok(
  $$ update public.jornada_respostas_modulo
     set respostas = '{"situacao": "editado pela propria usuaria"}'::jsonb
     where id = '11111111-2222-3333-4444-555555555555' $$,
  'usuária A consegue atualizar a própria resposta (upsert de rascunho)'
);

-- Cenário 2: usuária A tentando acessar dados da usuária B (nenhuma linha
-- existe ainda para B, então este é um teste de isolamento por construção:
-- criamos a resposta de B como service role e confirmamos que A não a vê).
reset role;
set local role postgres;
insert into public.jornada_respostas_modulo
  (id, user_id, jornada_usuario_id, atividade_id, schema_version, respostas)
values (
  '66666666-7777-8888-9999-000000000000',
  'b0000000-0000-0000-0000-00000000000b',
  'f0000000-0000-0000-0000-00000000000f',
  'd0000000-0000-0000-0000-00000000000d',
  1,
  '{"situacao": "dado privado da usuaria B"}'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is(
  (select count(*)::int from public.jornada_respostas_modulo where id = '66666666-7777-8888-9999-000000000000'),
  0,
  'usuária A NÃO vê a resposta da usuária B via SELECT'
);

select throws_ok(
  $$ update public.jornada_respostas_modulo
     set respostas = '{"situacao": "tentativa de adulterar dado de outra usuaria"}'::jsonb
     where id = '66666666-7777-8888-9999-000000000000' $$,
  null,
  null,
  'usuária A não consegue atualizar (0 linhas afetadas / RLS bloqueia) a resposta da usuária B'
);

-- Cenário 3: acesso anônimo.
reset role;
set local role anon;
reset request.jwt.claims;

select throws_ok(
  $$ select * from public.jornada_respostas_modulo $$,
  '42501',
  null,
  'acesso anônimo é bloqueado por falta de GRANT (permission denied for table)'
);

-- Cenário 4: INSERT tentando falsificar outro user_id.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ insert into public.jornada_respostas_modulo
       (user_id, jornada_usuario_id, atividade_id, schema_version, respostas)
     values (
       'b0000000-0000-0000-0000-00000000000b',
       'f0000000-0000-0000-0000-00000000000f',
       'd0000000-0000-0000-0000-00000000000d',
       1,
       '{"situacao": "insercao falsificando user_id de outra usuaria"}'::jsonb
     ) $$,
  null,
  null,
  'INSERT com user_id de outra usuária é rejeitado pela WITH CHECK da policy'
);

select throws_ok(
  $$ insert into public.jornada_respostas_modulo
       (user_id, jornada_usuario_id, atividade_id, schema_version, respostas)
     values (
       'a0000000-0000-0000-0000-00000000000a',
       'f0000000-0000-0000-0000-00000000000f',
       'd0000000-0000-0000-0000-00000000000d',
       1,
       '{"situacao": "user_id correto mas jornada_usuario_id de outra usuaria"}'::jsonb
     ) $$,
  null,
  null,
  'INSERT com jornada_usuario_id que não pertence ao user_id é rejeitado pelo trigger de propriedade'
);

select is(
  (select count(*)::int from public.jornada_respostas_modulo where user_id = 'a0000000-0000-0000-0000-00000000000a'),
  1,
  'nenhuma linha falsa foi de fato gravada para a usuária A depois das tentativas acima'
);

select * from finish();
rollback;
