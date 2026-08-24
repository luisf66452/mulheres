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
