-- 0021_clube_rose_limite_petalas_gratuito.sql
-- Teto de 1000 Pétalas para usuárias do plano gratuito. Premium acumula sem
-- limite. Ao atingir o teto, o ganho é bloqueado por inteiro (sem crédito
-- parcial) mas a ação de origem (check-in/prática/jornada) continua sendo
-- registrada normalmente do lado do Next.js — só o crédito de Pétalas não
-- acontece. Ver docs/superpowers/specs/2026-08-15-limite-petalas-gratuito-design.md.
--
-- O valor 1000 também aparece em src/lib/clube-rose/config.ts
-- (LIMITE_PETALAS_GRATUITO), só para exibição na UI — este arquivo SQL é a
-- fonte de verdade que de fato bloqueia o crédito. Os dois precisam ficar
-- sincronizados manualmente se o valor mudar no futuro.

create or replace function petalas_limite_gratuito_atingido(
  p_usuaria_id uuid,
  p_saldo_atual integer
) returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(p_saldo_atual, 0) >= 1000
    and coalesce((select plano from perfis where id = p_usuaria_id), 'free') <> 'premium';
$$;

revoke execute on function petalas_limite_gratuito_atingido(uuid, integer) from public;
revoke execute on function petalas_limite_gratuito_atingido(uuid, integer) from authenticated, anon;
grant execute on function petalas_limite_gratuito_atingido(uuid, integer) to service_role;

drop function if exists conceder_petalas(uuid, tipo_evento_petalas, uuid, integer);

create or replace function conceder_petalas(
  p_usuaria_id uuid,
  p_tipo_evento tipo_evento_petalas,
  p_referencia_id uuid,
  p_quantidade integer
) returns table (concedido boolean, saldo integer, limite_gratuito_atingido boolean)
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

  -- Trava a linha da carteira antes de decidir: evita que duas concessões
  -- concorrentes leiam o mesmo saldo "abaixo do teto" e ambas creditem.
  select saldo into v_saldo from carteiras_petalas where usuaria_id = p_usuaria_id for update;

  if petalas_limite_gratuito_atingido(p_usuaria_id, v_saldo) then
    return query select false, v_saldo, true;
    return;
  end if;

  begin
    update carteiras_petalas
      set saldo = carteiras_petalas.saldo + p_quantidade, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning carteiras_petalas.saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, p_tipo_evento, p_referencia_id, p_quantidade, v_saldo);

    return query select true, v_saldo, false;
    return;
  exception
    when unique_violation then
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo, false;
      return;
  end;
end;
$$;

revoke execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) from public;
revoke execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) from authenticated, anon;
grant execute on function conceder_petalas(uuid, tipo_evento_petalas, uuid, integer) to service_role;
