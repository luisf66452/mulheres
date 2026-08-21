-- 0032_perfis_confirmacao_pais.sql
-- A Rose vai começar a ser testada em Portugal, mas `perfis.pais` sempre
-- teve default 'BR' e nunca existiu um jeito da usuária confirmar/corrigir
-- isso — toda conta nova virava 'BR' silenciosamente, mesmo testando a
-- partir de Portugal. Esta migração NÃO reescreve `pais` de nenhuma conta
-- existente (só o default de linhas futuras muda) e adiciona uma coluna para
-- registrar quando a própria usuária confirmou o país, para nunca perguntar
-- de novo depois de confirmado e para o app nunca apresentar recursos de
-- segurança de um país como certos antes dessa confirmação (ver proxy.ts,
-- src/app/onboarding, src/app/seguranca/page.tsx).

alter table public.perfis
  add column pais_confirmado_em timestamptz;

comment on column public.perfis.pais_confirmado_em is
  'Quando a própria usuária confirmou explicitamente o país (onboarding ou '
  'primeiro acesso pós-lançamento em Portugal). Nulo = ainda não confirmado '
  '— nesse estado o app não deve apresentar recursos de segurança de um país '
  'específico como certamente corretos.';

-- Todos os registros existentes até aqui só podiam ser 'BR' (único valor que
-- o app já escreveu, via default de 0001_init.sql) — constraint aditiva,
-- não reescreve dado nenhum, só passa a exigir que valores futuros sejam um
-- dos países com recursos de segurança cadastrados (recursos_seguranca).
alter table public.perfis
  add constraint perfis_pais_suportado check (pais in ('BR', 'PT'));

-- Portugal é o mercado do teste inicial (beta) — contas novas a partir de
-- agora recebem 'PT' como ponto de partida, mas continuam precisando passar
-- pela confirmação explícita (pais_confirmado_em) antes de o app tratar isso
-- como definitivo. Contas já existentes não são tocadas por este ALTER.
alter table public.perfis
  alter column pais set default 'PT';
