-- 0025_security_hardening_internal_functions.sql
-- Endurece funções internas apontadas pelos Supabase Security Advisors.
-- Mantém as funções de signup disponíveis explicitamente para o subsistema
-- de autenticação, mas não via Data API para anon/authenticated/PUBLIC.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user_carteira_petalas() from public, anon, authenticated;

grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.handle_new_user_carteira_petalas() to supabase_auth_admin;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

create or replace function public.set_atualizada_em_jornadas_usuarias()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;
