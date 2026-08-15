-- 0017_clube_rose_rpc_resgate_v2.sql
-- Fase 1 (parte 2) do Clube Rose.
--
-- 1) Reescreve resgatar_recompensa: a versão anterior (0010) confiava em
--    p_custo enviado pelo chamador (aceitável só porque o único chamador em
--    src/app/clube-rose/actions.ts sempre lia o custo do catálogo em código,
--    nunca de input do cliente — risco aceito documentado no próprio 0010).
--    Agora que o custo/estoque/status vivem em recompensas_catalogo (0014),
--    a função lê o valor autoritativo direto do banco, elimina esse ponto de
--    confiança, e bloqueia resgate de recompensa pausada/futura/sem estoque.
--    O resgate nasce em status 'solicitado' (0015) em vez de já "concluído" —
--    nenhuma recompensa é entregue automaticamente.
--
-- 2) Cria revisar_resgate: a RPC que uma administradora usa (via Fase 7,
--    backend com service role) para mover um pedido pelos estados
--    (solicitado → em_analise → aprovado → entregue, ou → recusado/cancelado
--    a qualquer momento antes de 'entregue'). Recusar ou cancelar devolve as
--    Pétalas por uma NOVA transação de estorno (nunca apaga/edita a transação
--    de débito original) e devolve 1 unidade ao estoque, se aplicável.

drop function if exists resgatar_recompensa(uuid, text, integer);

create or replace function resgatar_recompensa(
  p_usuaria_id uuid,
  p_recompensa_chave text
) returns table (resgatado boolean, saldo integer, motivo text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_custo integer;
  v_estoque integer;
  v_status text;
  v_saldo integer;
  v_resgate_id uuid;
begin
  select custo, estoque, status
    into v_custo, v_estoque, v_status
    from recompensas_catalogo
    where chave = p_recompensa_chave
    for update;

  if v_custo is null then
    return query select false, null::integer, 'recompensa_invalida';
    return;
  end if;

  if v_status <> 'ativa' then
    return query select false, null::integer, 'recompensa_indisponivel';
    return;
  end if;

  if v_estoque is not null and v_estoque <= 0 then
    return query select false, null::integer, 'sem_estoque';
    return;
  end if;

  begin
    insert into resgates_recompensas (usuaria_id, recompensa_chave, status)
    values (p_usuaria_id, p_recompensa_chave, 'solicitado')
    returning id into v_resgate_id;

    select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id for update;

    if v_saldo is null or v_saldo < v_custo then
      raise exception 'saldo insuficiente' using errcode = 'P0002';
    end if;

    update carteiras_petalas
      set saldo = carteiras_petalas.saldo - v_custo, atualizada_em = now()
      where usuaria_id = p_usuaria_id
      returning carteiras_petalas.saldo into v_saldo;

    insert into transacoes_petalas
      (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
    values
      (p_usuaria_id, 'resgate_recompensa', v_resgate_id, -v_custo, v_saldo);

    if v_estoque is not null then
      update recompensas_catalogo
        set estoque = estoque - 1, atualizada_em = now()
        where chave = p_recompensa_chave;
    end if;

    return query select true, v_saldo, null::text;
    return;
  exception
    when unique_violation then
      -- já existe um pedido ativo (ou já concluído) para esta recompensa —
      -- ver índice parcial resgates_recompensas_ativo_unico em 0015.
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo, 'ja_resgatada';
      return;
    when sqlstate 'P0002' then
      -- saldo insuficiente: o sub-bloco inteiro (incluindo o insert do
      -- resgate acima) é revertido, então o pedido NÃO fica registrado.
      select c.saldo into v_saldo from carteiras_petalas c where c.usuaria_id = p_usuaria_id;
      return query select false, v_saldo, 'saldo_insuficiente';
      return;
  end;
end;
$$;

revoke execute on function resgatar_recompensa(uuid, text) from public;
revoke execute on function resgatar_recompensa(uuid, text) from authenticated, anon;
grant execute on function resgatar_recompensa(uuid, text) to service_role;

create or replace function revisar_resgate(
  p_admin_id uuid,
  p_resgate_id uuid,
  p_novo_status text,
  p_observacao text default null
) returns table (atualizado boolean, motivo text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_status_atual text;
  v_usuaria_id uuid;
  v_recompensa_chave text;
  v_custo integer;
  v_saldo integer;
  v_transicoes_validas text[];
begin
  if p_novo_status not in ('em_analise', 'aprovado', 'entregue', 'recusado', 'cancelado') then
    return query select false, 'status_invalido';
    return;
  end if;

  -- Checagem de autorização feita também aqui dentro (defesa em profundidade),
  -- mesmo que hoje só a service role consiga chamar esta função — o backend
  -- da área administrativa (Fase 7) deve checar isso de novo antes de chamar.
  select role into v_role from perfis where id = p_admin_id;
  if v_role is distinct from 'admin' then
    return query select false, 'nao_autorizada';
    return;
  end if;

  select status, usuaria_id, recompensa_chave
    into v_status_atual, v_usuaria_id, v_recompensa_chave
    from resgates_recompensas
    where id = p_resgate_id
    for update;

  if v_status_atual is null then
    return query select false, 'resgate_nao_encontrado';
    return;
  end if;

  if v_status_atual in ('entregue', 'recusado', 'cancelado') then
    return query select false, 'estado_final';
    return;
  end if;

  v_transicoes_validas := case v_status_atual
    when 'solicitado' then array['em_analise', 'aprovado', 'recusado', 'cancelado']
    when 'em_analise' then array['aprovado', 'recusado', 'cancelado']
    when 'aprovado' then array['entregue', 'cancelado']
    else array[]::text[]
  end;

  if not (p_novo_status = any(v_transicoes_validas)) then
    return query select false, 'transicao_invalida';
    return;
  end if;

  if p_novo_status in ('recusado', 'cancelado') then
    select custo into v_custo from recompensas_catalogo where chave = v_recompensa_chave for update;

    if v_custo is not null then
      update carteiras_petalas
        set saldo = saldo + v_custo, atualizada_em = now()
        where usuaria_id = v_usuaria_id
        returning saldo into v_saldo;

      -- idempotência: referencia_id = p_resgate_id garante que este pedido só
      -- pode ser estornado uma única vez, mesmo que revisar_resgate seja
      -- chamada de novo por engano.
      insert into transacoes_petalas
        (usuaria_id, tipo_evento, referencia_id, quantidade, saldo_resultante)
      values
        (v_usuaria_id, 'estorno_resgate', p_resgate_id, v_custo, v_saldo);

      update recompensas_catalogo
        set estoque = estoque + 1, atualizada_em = now()
        where chave = v_recompensa_chave and estoque is not null;
    end if;
  end if;

  update resgates_recompensas
    set status = p_novo_status,
        observacao_admin = coalesce(p_observacao, observacao_admin),
        revisado_por = p_admin_id,
        revisado_em = now(),
        atualizada_em = now()
    where id = p_resgate_id;

  return query select true, null::text;
end;
$$;

revoke execute on function revisar_resgate(uuid, uuid, text, text) from public;
revoke execute on function revisar_resgate(uuid, uuid, text, text) from authenticated, anon;
grant execute on function revisar_resgate(uuid, uuid, text, text) to service_role;
