-- 20260825001010_perfis_onboarding_extra.sql
-- Colunas de onboarding personalizado para public.perfis (seção 2 do design
-- "Evolução da Rose Fase 2"). objetivos e temas_sensiveis são dados
-- sensíveis: validados no servidor contra listas fechadas (as opções
-- literais do enunciado da seção 2), nunca strings arbitrárias vindas do
-- client. onboarding_extra_concluido_em é preenchido só quando a usuária
-- efetivamente conclui a etapa (mesmo escolhendo "prefiro decidir
-- depois"/"prefiro não responder" em algum campo — a etapa foi respondida).
-- onboarding_extra_dispensado_em é preenchido só quando uma usuária antiga
-- dispensa o banner em Perfil sem preencher nada — distinto de conclusão
-- real. Nenhuma coluna nova para o lembrete: reaproveita
-- preferencias_notificacoes + horario_preferido_notificacao já existentes.
alter table public.perfis
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists temas_sensiveis text[] not null default '{}',
  add column if not exists onboarding_extra_concluido_em timestamptz,
  add column if not exists onboarding_extra_dispensado_em timestamptz;

comment on column public.perfis.objetivos is
  'Multi-seleção opcional das opções fechadas de objetivo (seção 2 do design). Validado no servidor contra lista fechada — nunca string arbitrária. "Prefiro decidir depois" grava array vazio, nunca um valor sentinela. Sem GRANT de UPDATE direto para authenticated — só server action dedicada com admin client.';

comment on column public.perfis.temas_sensiveis is
  'Multi-seleção opcional das opções fechadas de tema sensível (seção 2 do design). Mesma trava e mesma regra de "array vazio quando pulado" de objetivos.';

comment on column public.perfis.onboarding_extra_concluido_em is
  'Preenchido só quando a usuária efetivamente conclui a etapa de personalização (mesmo pulando campos individuais). Nulo = etapa ainda não concluída. Sem GRANT de UPDATE direto para authenticated.';

comment on column public.perfis.onboarding_extra_dispensado_em is
  'Preenchido só quando uma usuária antiga dispensa o banner de personalização em Perfil sem preencher nada. Distinto de onboarding_extra_concluido_em (conclusão real). Sem GRANT de UPDATE direto para authenticated.';

-- Sem alteração no GRANT de UPDATE por coluna de authenticated (0033
-- continua valendo como está: nome, frase_pessoal, faixa_etaria,
-- fuso_horario, idioma, foto_url, horario_preferido_notificacao,
-- consentimento_dados_sensiveis_em) — as 4 colunas novas ficam de fora de
-- propósito, mesmo padrão de trava de pais/plano/pais_confirmado_em.
-- Escrita só via server action dedicada usando o admin client (seção 2,
-- fora deste plano), que também permite apagar (gravar '{}') ou alterar a
-- qualquer momento.

notify pgrst, 'reload schema';
