-- 0031_jornada_respostas_modulo_indices.sql
-- Índices de cobertura para as foreign keys de jornada_respostas_modulo,
-- apontados pelo Performance Advisor do Supabase (unindexed_foreign_keys)
-- logo após a migration 0029. Puramente aditivo, sem risco de dados.

create index if not exists jornada_respostas_modulo_atividade_id_idx
  on public.jornada_respostas_modulo (atividade_id);

create index if not exists jornada_respostas_modulo_jornada_usuario_id_idx
  on public.jornada_respostas_modulo (jornada_usuario_id);

create index if not exists jornada_respostas_modulo_sessao_id_idx
  on public.jornada_respostas_modulo (sessao_id);
