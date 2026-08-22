-- 20260822090000_push_notificacoes_avancado.sql
-- Sistema completo de lembretes Web Push (sessão abandonada, sessão
-- disponível, exercício/reflexão pendente, inatividade, continuidade da
-- jornada), com anti-spam real no servidor (limite diário/semanal, intervalo
-- mínimo, horário silencioso, dedup por pendência) e suporte a múltiplos
-- dispositivos por conta.
--
-- Antes desta migração só existia um lembrete diário genérico de check-in
-- (api/push/send-due), sem fila, sem dedup por evento e sem limites de
-- frequência — qualquer notificação nova exigiria reimplementar essas
-- garantias do zero.

-- Multi-dispositivo: já era possível (endpoint é a chave, não
-- usuaria_id+endpoint), mas não guardávamos nada que ajudasse a usuária a
-- reconhecer QUAL dispositivo é qual na tela de configurações, nem quando a
-- inscrição foi renovada pela última vez.
alter table public.push_subscriptions
  add column if not exists user_agent text,
  add column if not exists atualizado_em timestamptz not null default now();

-- Preferências avançadas: pausa temporária ("pausar por 7 dias"), lembrete de
-- inatividade como categoria própria, e horário silencioso configurável (com
-- um padrão sensato de 21:30–09:00 já aplicado a quem nunca abriu esta tela,
-- mesmo espírito do default de dias_semana em 20260818133603).
alter table public.preferencias_notificacoes
  add column if not exists lembrete_inatividade boolean not null default true,
  add column if not exists horario_silencio_inicio time not null default '21:30',
  add column if not exists horario_silencio_fim time not null default '09:00',
  add column if not exists pausada_ate date;

comment on column public.preferencias_notificacoes.pausada_ate is
  'Data (fuso da usuária) até a qual TODOS os lembretes ficam suspensos — usado pelo botão "pausar por 7 dias". Null = não pausada.';

-- Fila + histórico mínimo de envio das notificações "inteligentes" (as que
-- dependem de estado real de progresso, não só de um horário fixo diário).
-- Um único registro cobre as duas pontas: enquanto pendente/processando ele é
-- a fila; ao virar terminal (enviada/cancelada/falha) os campos de conteúdo
-- são zerados pelo próprio código de envio (ver src/lib/push/enviar.ts),
-- deixando só tipo/categoria/status/timestamp — nunca o texto da mensagem —
-- como exige o requisito de histórico sem conteúdo sensível.
--
-- dedup_key identifica a PENDÊNCIA (não a mensagem): ex. "sessao_abandonada:
-- <sessaoId>", "inatividade_7d:<usuariaId>:<data>". A constraint unique em
-- (usuaria_id, dedup_key) é permanente — uma vez usada, uma dada pendência
-- nunca gera uma segunda notificação, mesmo depois de enviada. Categorias
-- recorrentes (sessao_disponivel, inatividade) incluem a data local na
-- própria chave, então cada dia elegível é uma pendência nova.
create table if not exists public.push_notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (
    categoria in (
      'sessao_abandonada',
      'sessao_disponivel',
      'praticas_pendente',
      'inatividade',
      'continuidade'
    )
  ),
  dedup_key text not null,
  titulo text,
  corpo text,
  url text,
  tag text,
  status text not null default 'pendente' check (
    status in ('pendente', 'processando', 'enviada', 'cancelada', 'falha')
  ),
  tentativas smallint not null default 0,
  agendado_para timestamptz not null,
  enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, dedup_key)
);

create index if not exists push_notificacoes_pendentes_devidas_idx
  on public.push_notificacoes (agendado_para)
  where status = 'pendente';

alter table public.push_notificacoes enable row level security;

-- Mesmo padrão de push_envios/acessos_administrativos: nenhuma policy para
-- authenticated/anon de propósito. Geração e envio só acontecem no cron
-- (service role) — a própria usuária nunca lê ou escreve esta tabela
-- diretamente, só enxerga o EFEITO (a notificação chegando, ou o histórico
-- resumido que uma tela futura possa expor via RPC/endpoint próprio).
grant select, insert, update on public.push_notificacoes to service_role;

-- push_envios (idempotência do lembrete diário de check-in) e
-- push_subscriptions precisam do mesmo tratamento de grant para o cron poder
-- de fato ler/gravar como service_role — reforça o que 0027 já concedeu,
-- caso esta migração seja aplicada num ambiente que pulou aquela.
grant select, insert on public.push_envios to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select on public.preferencias_notificacoes to service_role;
grant select on public.sessoes_jornadas_conteudo_progresso to service_role;
grant select on public.jornadas_usuarias to service_role;
grant select on public.conclusoes_praticas_conteudo to service_role;
grant select on public.checkins to service_role;
grant select on public.perfis to service_role;

notify pgrst, 'reload schema';
