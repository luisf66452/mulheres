-- 0010_clube_rose_recompensas.sql
-- Fase 4 do Clube Rose: catálogo de recompensas (mantido em código, não em
-- tabela — ver src/lib/clube-rose/recompensas.ts) e registro de resgates.

create table resgates_recompensas (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  recompensa_chave text not null,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, recompensa_chave)
);

alter table resgates_recompensas enable row level security;

create policy "usuaria vê seus resgates de recompensas" on resgates_recompensas
  for select using (auth.uid() = usuaria_id);

-- Sem policy de insert/update/delete para o cliente: toda escrita passa pela
-- RPC resgatar_recompensa, restrita a service_role (mesmo padrão de
-- conceder_petalas em 0008).
grant select on resgates_recompensas to authenticated;

create or replace function resgatar_recompensa(
  p_usuaria_id uuid,
  p_recompensa_chave text,
  p_custo integer
) returns table (resgatado boolean, saldo integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_saldo integer;
  v_resgate_id uuid;
begin
  if p_custo <= 0 then
    raise exception 'custo deve ser positivo';
  end if;

  begin
    insert into resgates_recompensas (usuaria_id, recompensa_chave)
    values (p_usuaria_id, p_recompensa_chave)
    returning id into v_resgate_id;

    select saldo into v_saldo from carteiras_petalas where usuaria_id = p_usuaria_id for update;

    if v_saldo is null or v_saldo < p_custo then
      raise exception 'saldo insuficiente';
    end if;

    update carteiras_petalas
      set saldo = carteiras_petalas.saldo - p_custo, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning carteiras_petalas.saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, 'resgate_recompensa', v_resgate_id, -p_custo, v_saldo);

    return query select true, v_saldo;
    return;
  exception
    when unique_violation then
      -- já resgatada antes (recompensa de uso único): não duplica, não desconta de novo.
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo;
      return;
    when raise_exception then
      -- saldo insuficiente: o sub-bloco inteiro (incluindo o insert do resgate
      -- acima) é revertido, então a recompensa NÃO fica marcada como resgatada.
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo;
      return;
  end;
end;
$$;

revoke execute on function resgatar_recompensa(uuid, text, integer) from public;
revoke execute on function resgatar_recompensa(uuid, text, integer) from authenticated, anon;
grant execute on function resgatar_recompensa(uuid, text, integer) to service_role;
