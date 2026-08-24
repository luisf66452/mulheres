-- 20260824182330_exportacoes_dados.sql
-- Tabela interna de auditoria da seção 8 do design "Evolução da Rose Fase
-- 2" (exportação de dados): registra só QUE uma exportação ocorreu
-- (usuaria_id + tipo + quando), nunca o conteúdo exportado. Mesmo padrão de
-- acessos_administrativos em 0001_init.sql — RLS habilitada, mas SEM
-- nenhuma policy para authenticated/anon de propósito, então nenhuma role de
-- client consegue ler ou escrever esta tabela mesmo com RLS habilitada
-- (RLS só filtra linhas para roles que já têm GRANT na tabela). Escrita
-- exclusiva pela própria rota de exportação, no servidor, usando o admin
-- client (service role) — nunca a partir de input do cliente.
create table if not exists public.exportacoes_dados (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('json', 'csv')),
  criado_em timestamptz not null default now()
);

alter table public.exportacoes_dados enable row level security;
-- Nenhuma policy criada de propósito: sem policy, nenhuma role de client
-- (anon/authenticated) consegue ler ou escrever. Só a service role key tem
-- acesso, na rota de exportação (seção 8, fora deste plano).

-- Revoga explicitamente qualquer privilégio default que o Supabase possa ter
-- concedido a anon/authenticated na criação da tabela (mesmo cuidado já
-- tomado em 20260822093000_push_fila_revoga_anon_authenticated.sql para
-- push_notificacoes/push_envios) — não confia apenas em "nenhuma policy =
-- nenhum acesso" para SELECT/INSERT/UPDATE/DELETE, e cobre também TRUNCATE,
-- que não é filtrado por RLS.
revoke all on public.exportacoes_dados from anon, authenticated;

notify pgrst, 'reload schema';
