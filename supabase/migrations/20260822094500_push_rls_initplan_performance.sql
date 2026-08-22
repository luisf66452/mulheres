-- 20260822094500_push_rls_initplan_performance.sql
-- Advisor de performance (auth_rls_initplan) aponta várias tabelas do
-- projeto reavaliando auth.uid() por linha nas policies de RLS — pré-
-- existente em quase todo o schema desde 0001_init.sql, fora do escopo desta
-- tarefa de push. Corrige aqui só as duas tabelas que este sistema de
-- notificações usa pesadamente em todo cron run (push_subscriptions e
-- preferencias_notificacoes), trocando `auth.uid()` por
-- `(select auth.uid())` — o Postgres avalia o subselect uma única vez por
-- consulta em vez de uma vez por linha, sem mudar o comportamento (mesmo
-- resultado, só um plano de execução mais barato).
alter policy "usuaria gerencia proprias subscriptions"
  on public.push_subscriptions
  using ((select auth.uid()) = usuaria_id)
  with check ((select auth.uid()) = usuaria_id);

alter policy "usuaria gerencia proprias preferencias de notificacao"
  on preferencias_notificacoes
  using ((select auth.uid()) = usuaria_id)
  with check ((select auth.uid()) = usuaria_id);
