-- 0014_clube_rose_catalogo_recompensas.sql
-- Fase 1 (parte 2) do Clube Rose: move o custo/estoque/status das recompensas
-- de código (src/lib/clube-rose/recompensas.ts) para uma tabela própria, para
-- que uma administradora possa pausar uma recompensa, controlar estoque, e
-- para que a RPC de resgate (0017) deixe de confiar num custo enviado pelo
-- chamador e passe a ler o valor autoritativo direto do banco.
--
-- O conteúdo editorial (nome, descrição, mensagem) continua existindo aqui
-- também — mantê-lo só em código criaria duas fontes de verdade para o mesmo
-- item. src/lib/clube-rose/recompensas.ts passa a guardar só metadados de
-- apresentação que não afetam segurança/custo (ex. ícone/tipo visual).

create table recompensas_catalogo (
  chave text primary key,
  nome text not null,
  descricao text not null,
  mensagem text not null,
  tipo text not null check (tipo in ('digital', 'personalizacao', 'conteudo', 'experiencia', 'futura')),
  custo integer not null check (custo > 0),
  requer_premium boolean not null default true,
  -- Recompensas com valor financeiro real (produto físico, benefício de
  -- parceiro etc.) exigem revisão jurídica/fiscal/contábil antes de operar em
  -- produção — ver pendência registrada no plano da Fase 1. Este campo existe
  -- para que essa revisão possa ser direcionada objetivamente às linhas que
  -- importam, e para bloquear ativação acidental (status só pode ser 'ativa'
  -- depois dessa revisão, controlada manualmente por uma administradora).
  tem_valor_financeiro boolean not null default false,
  -- null = estoque ilimitado (recompensas puramente digitais).
  estoque integer check (estoque is null or estoque >= 0),
  -- 'futura': ainda não resgatável (sem parceria/operação confirmada).
  -- 'pausada': foi ativa, administradora pausou temporariamente.
  -- 'ativa': resgatável normalmente (sujeito a estoque e Pro).
  status text not null default 'futura' check (status in ('ativa', 'pausada', 'futura')),
  criado_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

alter table recompensas_catalogo enable row level security;

create policy "qualquer usuaria autenticada le catalogo de recompensas"
  on recompensas_catalogo for select
  using (auth.role() = 'authenticated');

-- Sem policy/grant de insert/update/delete para o cliente: o catálogo só é
-- alterado por uma administradora, via backend com service role (Fase 7).
grant select on recompensas_catalogo to authenticated;

-- Seed: mesmos valores e chaves já usados em src/lib/clube-rose/recompensas.ts,
-- preservados sem alteração (ver regra "não altere valores sem autorização").
insert into recompensas_catalogo
  (chave, nome, descricao, mensagem, tipo, custo, requer_premium, tem_valor_financeiro, estoque, status)
values
  ('selo_comecei_a_florescer', 'Selo "Comecei a Florescer"',
   'Selo especial exibido no perfil da usuária.',
   'Toda transformação começa com um pequeno gesto de cuidado.',
   'digital', 1000, true, false, null, 'ativa'),
  ('moldura_floral_perfil', 'Moldura Floral para o Perfil',
   'Moldura exclusiva com flores delicadas ao redor da foto de perfil.',
   'Um detalhe floral só seu.',
   'personalizacao', 2500, true, false, null, 'ativa'),
  ('tema_jardim_rose', 'Tema "Jardim Rose"',
   'Tema visual exclusivo com cores, fundos e pequenos detalhes florais.',
   'Um jardim só seu, dentro do app.',
   'personalizacao', 5000, true, false, null, 'ativa'),
  ('kit_digital_autocuidado', 'Kit Digital de Autocuidado',
   'Wallpapers, cartões de afirmações, páginas de reflexão e materiais para baixar.',
   'Um presente para os seus próximos dias.',
   'conteudo', 7500, true, false, null, 'ativa'),
  ('experiencia_especial_rose', 'Experiência Especial Rose',
   'Práticas especiais, áudios relaxantes e reflexões de autocompaixão.',
   'Um convite para ir ainda mais fundo no seu cuidado.',
   'experiencia', 10000, true, false, null, 'ativa'),
  ('beneficio_parceiro_rose', 'Benefício de Parceiro Rose',
   'Desconto, produto digital ou benefício de uma marca parceira alinhada aos valores do Rose.',
   'Em breve.',
   'futura', 15000, true, true, null, 'futura'),
  ('presente_especial_rose', 'Presente Especial Rose',
   'Presente físico ou experiência especial, disponível em campanhas específicas.',
   'Recompensa futura.',
   'futura', 25000, true, true, null, 'futura');
