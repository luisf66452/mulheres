-- 20260822093000_push_fila_revoga_anon_authenticated.sql
-- Auditoria pós-deploy encontrou TRUNCATE/REFERENCES/TRIGGER concedidos a
-- anon/authenticated em push_notificacoes e push_envios — não vêm de nenhum
-- GRANT explícito destas migrations, e sim do "ALTER DEFAULT PRIVILEGES"
-- global que o próprio Supabase configura para toda tabela nova em `public`.
-- Nenhum desses três privilégios expõe linhas (RLS sem policy já bloqueia
-- SELECT/INSERT/UPDATE/DELETE para essas roles), mas TRUNCATE em particular
-- não é filtrado por RLS — revoga explicitamente por completo, em vez de
-- confiar apenas no "nenhuma policy = nenhum acesso" para estas duas tabelas
-- internas da fila/histórico de push, que devem ser tocadas somente por
-- service_role (cron).
revoke all on public.push_notificacoes from anon, authenticated;
revoke all on public.push_envios from anon, authenticated;

notify pgrst, 'reload schema';
