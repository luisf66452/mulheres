-- Perfis (extends auth.users; one row per usuária)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  plano text not null default 'free' check (plano in ('free', 'premium')),
  pais text not null default 'BR',
  horario_preferido_notificacao time, -- null until user sets a preference
  consentimento_dados_sensiveis_em timestamptz, -- null until onboarding consent step completes
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "usuaria le proprio perfil"
  on public.perfis for select
  using (auth.uid() = id);

create policy "usuaria atualiza proprio perfil"
  on public.perfis for update
  using (auth.uid() = id);

-- Auto-create a perfil row when a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  humor smallint not null check (humor between 1 and 5),
  imagem_corporal smallint not null check (imagem_corporal between 1 and 5),
  comida smallint not null check (comida between 1 and 5),
  texto_livre text,
  sinal_seguranca boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (usuaria_id, data)
);

alter table public.checkins enable row level security;

create policy "usuaria le proprios checkins"
  on public.checkins for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprios checkins"
  on public.checkins for insert
  with check (auth.uid() = usuaria_id);

-- Práticas (biblioteca de conteúdo, curada pela psicóloga)
create table public.praticas (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  tipo text not null check (tipo in ('respiracao', 'reflexao', 'afirmacao', 'movimento')),
  titulo text not null,
  conteudo text not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'revisada', 'publicada')),
  criado_em timestamptz not null default now()
);

alter table public.praticas enable row level security;

create policy "qualquer usuaria autenticada le praticas publicadas"
  on public.praticas for select
  using (auth.role() = 'authenticated' and status = 'publicada');

-- Regras de recomendação (também curadas pela psicóloga)
create table public.regras_recomendacao (
  id uuid primary key default gen_random_uuid(),
  humor_min smallint not null,
  humor_max smallint not null,
  imagem_corporal_min smallint not null,
  imagem_corporal_max smallint not null,
  comida_min smallint not null,
  comida_max smallint not null,
  eh_sinal_seguranca boolean not null default false,
  categoria_pratica text,
  prioridade int not null default 0,
  ativa boolean not null default true
);

alter table public.regras_recomendacao enable row level security;

create policy "qualquer usuaria autenticada le regras ativas"
  on public.regras_recomendacao for select
  using (auth.role() = 'authenticated' and ativa = true);

-- Sessões (prática feita + sensação antes/depois)
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  pratica_id uuid not null references public.praticas(id),
  sensacao_antes smallint check (sensacao_antes between 1 and 5),
  sensacao_depois smallint check (sensacao_depois between 1 and 5),
  criado_em timestamptz not null default now()
);

alter table public.sessoes enable row level security;

create policy "usuaria le proprias sessoes"
  on public.sessoes for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere proprias sessoes"
  on public.sessoes for insert
  with check (auth.uid() = usuaria_id);

-- Recursos de segurança (configurável por país)
create table public.recursos_seguranca (
  id uuid primary key default gen_random_uuid(),
  pais text not null default 'BR',
  titulo text not null,
  corpo text not null,
  ordem int not null default 0
);

alter table public.recursos_seguranca enable row level security;

create policy "qualquer usuaria autenticada le recursos de seguranca"
  on public.recursos_seguranca for select
  using (auth.role() = 'authenticated');

-- Intenção de pagamento (sem transação real)
create table public.intencao_pagamento (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  plano_escolhido text not null,
  preco_hipotetico numeric,
  criado_em timestamptz not null default now()
);

alter table public.intencao_pagamento enable row level security;

create policy "usuaria le propria intencao de pagamento"
  on public.intencao_pagamento for select
  using (auth.uid() = usuaria_id);

create policy "usuaria insere propria intencao de pagamento"
  on public.intencao_pagamento for insert
  with check (auth.uid() = usuaria_id);

-- Push subscriptions (uma por dispositivo/navegador)
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "usuaria gerencia proprias subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = usuaria_id)
  with check (auth.uid() = usuaria_id);

-- Acessos administrativos (log de acesso pontual a dados individuais; sem acesso via client, só service role)
create table public.acessos_administrativos (
  id uuid primary key default gen_random_uuid(),
  usuaria_id uuid not null references public.perfis(id),
  acessado_por text not null,
  motivo text not null,
  criado_em timestamptz not null default now()
);

alter table public.acessos_administrativos enable row level security;
-- Nenhuma policy criada de propósito: sem policy, nenhuma role de client (anon/authenticated)
-- consegue ler ou escrever. Só a service role key (usada em Task 17) tem acesso.
