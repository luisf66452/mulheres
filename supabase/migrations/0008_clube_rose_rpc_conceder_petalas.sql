-- 0008_clube_rose_rpc_conceder_petalas.sql

create or replace function conceder_petalas(
  p_usuaria_id uuid,
  p_tipo_evento tipo_evento_petalas,
  p_referencia_id uuid,
  p_quantidade integer
) returns table (concedido boolean, saldo integer)
language plpgsql
security definer
set search_path = public, pg_temp
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
      set saldo = carteiras_petalas.saldo + p_quantidade, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning carteiras_petalas.saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, p_tipo_evento, p_referencia_id, p_quantidade, v_saldo);

    return query select true, v_saldo;
    return;
  exception
    when unique_violation then
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo;
      return;
  end;
end;
$$;

-- C2: a RPC concede Pétalas com o valor que o CHAMADOR informa (p_quantidade),
-- sem validar contra VALORES_PETALAS nem checar auth.uid(). Se ficasse exposta
-- à role "authenticated", qualquer usuária autenticada poderia chamar a RPC
-- diretamente pela API REST do Supabase e creditar Pétalas arbitrárias para
-- si mesma. A defesa correta é tirar a função do alcance do cliente: só o
-- service_role (usado exclusivamente no servidor, nunca exposto ao navegador)
-- pode executá-la.
revoke execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) from authenticated, anon;
grant execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) to service_role;
