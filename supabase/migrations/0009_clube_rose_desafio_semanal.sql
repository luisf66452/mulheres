-- 0009_clube_rose_desafio_semanal.sql
-- Fase 3 do Clube Rose: registro de resgate do desafio semanal (1 por usuária/semana).
-- O progresso (etapas concluídas) é calculado sob demanda a partir de "sessoes" —
-- não há necessidade de uma tabela própria de progresso.

create table resgates_desafio_semanal (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  semana_inicio date not null,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, semana_inicio)
);

alter table resgates_desafio_semanal enable row level security;

create policy "usuaria vê seus resgates de desafio semanal" on resgates_desafio_semanal
  for select using (auth.uid() = usuaria_id);

-- Sem policy de insert/update/delete para o cliente: se o cliente pudesse
-- inserir livremente, uma usuária poderia registrar um resgate para uma
-- semana futura (ou sem ter cumprido a meta) e bloquear a si mesma para
-- sempre naquela semana, via a constraint UNIQUE abaixo. Toda escrita passa
-- pela RPC conceder_desafio_semanal, restrita a service_role, que registra o
-- resgate E credita as Pétalas na MESMA transação — nunca um sem o outro.
grant select on resgates_desafio_semanal to authenticated;

create or replace function conceder_desafio_semanal(
  p_usuaria_id uuid,
  p_semana_inicio date,
  p_quantidade integer
) returns table (concedido boolean, saldo integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_saldo integer;
  v_resgate_id uuid;
begin
  if p_quantidade <= 0 then
    raise exception 'quantidade deve ser positiva';
  end if;

  begin
    insert into resgates_desafio_semanal (usuaria_id, semana_inicio)
    values (p_usuaria_id, p_semana_inicio)
    returning id into v_resgate_id;

    insert into carteiras_petalas (usuaria_id, saldo)
    values (p_usuaria_id, 0)
    on conflict (usuaria_id) do nothing;

    update carteiras_petalas
      set saldo = carteiras_petalas.saldo + p_quantidade, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning carteiras_petalas.saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, 'desafio_semanal', v_resgate_id, p_quantidade, v_saldo);

    return query select true, v_saldo;
    return;
  exception
    when unique_violation then
      -- já concedido nesta semana: o insert do resgate E o crédito de saldo
      -- (se algum tivesse ocorrido dentro deste mesmo sub-bloco) são revertidos
      -- juntos — nunca fica um resgate registrado sem o crédito correspondente.
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, coalesce(v_saldo, 0);
      return;
  end;
end;
$$;

revoke execute on function conceder_desafio_semanal(uuid, date, integer) from public;
revoke execute on function conceder_desafio_semanal(uuid, date, integer) from authenticated, anon;
grant execute on function conceder_desafio_semanal(uuid, date, integer) to service_role;
