-- 0023_resgates_recompensas_revisado_por_set_null.sql
-- Tarefa 10 (Privacidade): a exclusão de conta usa
-- supabaseAdmin.auth.admin.deleteUser, que só funciona sem erro se TODA FK
-- apontando para auth.users(id) tiver ON DELETE definido. Todas já tinham
-- (cascade), exceto resgates_recompensas.revisado_por (criada em
-- 0015_clube_rose_resgates_estados.sql), que aponta para auth.users(id) sem
-- ON DELETE — o padrão do Postgres é RESTRICT. Se a conta excluída for de
-- uma administradora que já revisou algum resgate de outra usuária, a
-- exclusão falharia com "conflito de chave estrangeira".
--
-- Troca para ON DELETE SET NULL: o resgate (que pertence à OUTRA usuária,
-- não à administradora) continua existindo normalmente, só perde a
-- referência de quem revisou.
--
-- Idempotente: seguro rodar de novo caso já tenha sido aplicada.

alter table public.resgates_recompensas
  drop constraint if exists resgates_recompensas_revisado_por_fkey;

alter table public.resgates_recompensas
  add constraint resgates_recompensas_revisado_por_fkey
  foreign key (revisado_por) references auth.users(id) on delete set null;
