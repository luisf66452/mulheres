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
