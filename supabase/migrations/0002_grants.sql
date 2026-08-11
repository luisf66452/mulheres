-- Concede os privilégios de tabela que as políticas de RLS de 0001_init.sql pressupõem.
-- RLS restringe QUAIS linhas uma role pode tocar; não concede acesso à tabela em si.
-- Sem estes GRANTs, toda operação falha com "permission denied for table X" (42501),
-- mesmo com uma política de RLS correta permitindo a linha.
--
-- acessos_administrativos fica de fora de propósito: sem GRANT para anon/authenticated,
-- só a service role (que ignora RLS e já tem privilégio total) consegue ler/escrever nela.

grant usage on schema public to authenticated;

grant select, update on public.perfis to authenticated;
grant select, insert on public.checkins to authenticated;
grant select on public.praticas to authenticated;
grant select on public.regras_recomendacao to authenticated;
grant select, insert on public.sessoes to authenticated;
grant select on public.recursos_seguranca to authenticated;
grant select, insert on public.intencao_pagamento to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
