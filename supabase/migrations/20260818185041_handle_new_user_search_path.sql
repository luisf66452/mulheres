-- 0024_handle_new_user_search_path.sql
-- Tarefa 12 (verificação final): handle_new_user() (0001_init.sql) é
-- SECURITY DEFINER mas, ao contrário de toda função SECURITY DEFINER
-- criada depois dela neste projeto (handle_new_user_carteira_petalas em
-- 0007, conceder_petalas, resgatar_recompensa, revisar_resgate etc.), nunca
-- ganhou "set search_path = public, pg_temp". Sem isso, uma função
-- SECURITY DEFINER roda com o search_path de quem a invoca — abertura
-- clássica para search_path hijacking caso algum dia exista um jeito de
-- influenciar o search_path da sessão que dispara o INSERT em auth.users.
-- Não editamos 0001_init.sql (migração antiga já aplicada); fixamos a
-- função existente aqui.
--
-- Idempotente: apenas redefine a função (create or replace); seguro rodar
-- de novo.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;
