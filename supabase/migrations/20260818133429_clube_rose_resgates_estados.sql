-- 0015_clube_rose_resgates_estados.sql
-- Fase 1 (parte 2) do Clube Rose: pedidos de resgate passam a ter um estado
-- explícito em vez de "existe = resgatado". No beta, nenhuma recompensa é
-- entregue automaticamente — toda solicitação nasce 'solicitado' e precisa de
-- revisão administrativa manual (RPC revisar_resgate em 0017) para avançar.

alter table resgates_recompensas
  add column status text not null default 'solicitado'
    check (status in ('solicitado', 'em_analise', 'aprovado', 'entregue', 'recusado', 'cancelado')),
  add column observacao_admin text,
  add column revisado_por uuid references auth.users(id),
  add column revisado_em timestamptz,
  add column atualizada_em timestamptz not null default now();

-- Resgates criados antes desta migração vieram do modelo antigo (resgate =
-- entrega instantânea, sem análise). Marca como já entregues em vez de
-- reabrir retroativamente um fluxo de aprovação para pedidos já concluídos.
update resgates_recompensas
  set status = 'entregue', revisado_em = criado_em
  where status = 'solicitado';

-- A constraint unique(usuaria_id, recompensa_chave) original impedia
-- qualquer segunda tentativa da mesma recompensa, mesmo depois de uma
-- recusa/cancelamento — o que bloquearia permanentemente uma usuária cujo
-- pedido foi recusado por falta de estoque, por exemplo. Troca por um índice
-- único parcial: só bloqueia duplicata enquanto o pedido está ativo ou já
-- concluído; um pedido recusado/cancelado libera a recompensa para nova
-- tentativa.
alter table resgates_recompensas
  drop constraint resgates_recompensas_usuaria_id_recompensa_chave_key;

create unique index resgates_recompensas_ativo_unico
  on resgates_recompensas (usuaria_id, recompensa_chave)
  where status not in ('recusado', 'cancelado');
