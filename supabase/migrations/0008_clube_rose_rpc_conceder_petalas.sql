-- 0008_clube_rose_rpc_conceder_petalas.sql

create or replace function conceder_petalas(
  p_usuaria_id uuid,
  p_tipo_evento tipo_evento_petalas,
  p_referencia_id uuid,
  p_quantidade integer
) returns table (concedido boolean, saldo integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo integer;
begin
  if p_quantidade = 0 then
    raise exception 'quantidade deve ser diferente de zero';
  end if;

  insert into carteiras_petalas (usuaria_id, saldo)
  values (p_usuaria_id, 0)
  on conflict (usuaria_id) do nothing;

  begin
    update carteiras_petalas
      set saldo = saldo + p_quantidade, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, p_tipo_evento, p_referencia_id, p_quantidade, v_saldo);

    return query select true, v_saldo;
    return;
  exception
    when unique_violation then
      select saldo into v_saldo from carteiras_petalas where usuaria_id = p_usuaria_id;
      return query select false, v_saldo;
      return;
  end;
end;
$$;

grant execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) to authenticated;
