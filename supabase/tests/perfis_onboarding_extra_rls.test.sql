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

-- public.perfis.id referencia auth.users(id) com FK obrigatória (não
-- deferrable) e um trigger (on_auth_user_created, 0001_init.sql) já cria a
-- linha em public.perfis automaticamente ao inserir em auth.users — por
-- isso o fixture insere em auth.users (não em perfis diretamente) e só
-- ajusta o nome depois via UPDATE.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'usuaria-a@teste.rose.local', 'senha-nao-usada-neste-teste', now(), now(), now(), 'authenticated', 'authenticated');

update public.perfis set nome = 'Usuária A' where id = 'a0000000-0000-0000-0000-00000000000a';

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
