-- 0020_preferencias_notificacoes.sql
-- Fase 8: as preferências granulares de notificação (quais lembretes,
-- quais dias da semana) só existiam em localStorage
-- (src/lib/perfil/notificacoesPreferencias.ts, marcado como "camada
-- temporária") — o próprio cron de envio (api/push/send-due) não conseguia
-- respeitá-las, então enviava para todo mundo com horário definido,
-- inclusive quem tinha desligado o lembrete. Sem tabela própria não dá pra
-- corrigir isso no servidor.

create table preferencias_notificacoes (
  usuaria_id uuid primary key references auth.users(id) on delete cascade,
  lembrete_checkin boolean not null default true,
  lembrete_jornada boolean not null default true,
  lembrete_praticas boolean not null default true,
  avisos_novidades boolean not null default false,
  resumo_semanal boolean not null default true,
  -- 0 = domingo … 6 = sábado, mesmo formato de getDay() no JS.
  dias_semana smallint[] not null default '{0,1,2,3,4,5,6}',
  atualizada_em timestamptz not null default now()
);

alter table preferencias_notificacoes enable row level security;

create policy "usuaria gerencia proprias preferencias de notificacao"
  on preferencias_notificacoes for all
  using (auth.uid() = usuaria_id)
  with check (auth.uid() = usuaria_id);

-- Sem valor econômico/recompensa envolvida — mesmo padrão de
-- push_subscriptions (0001_init.sql): a própria usuária controla essas
-- linhas diretamente via RLS, sem precisar de RPC/service role.
grant select, insert, update, delete on preferencias_notificacoes to authenticated;
