-- 20260825000415_praticas_audio.sql
-- Colunas de áudio para a biblioteca de práticas (seção 6 do design
-- "Evolução da Rose Fase 2" — práticas em áudio). public.praticas continua
-- sendo a fonte canônica de conteúdo curado pela psicóloga (0001_init.sql);
-- esta migração só acrescenta os campos necessários para anexar um áudio
-- opcional a uma prática já existente, sem alterar o schema de texto atual.
--
-- `tipo` NÃO é alterado por esta migração — continua com os 4 valores
-- originais (respiracao, reflexao, afirmacao, movimento). Temas como
-- "autocompaixão"/"aterramento" são valores de `categoria` (já text livre,
-- sem constraint), não de `tipo`.
--
-- Visibilidade do player é decidida na camada de aplicação (seção 6, fora
-- deste plano), não por constraint de banco: só renderiza quando
-- status = 'publicada' AND audio_status = 'publicada' AND
-- audio_url/duracao_segundos/transcricao não nulos — isso permite existir
-- rascunho com dados parciais de áudio sem quebrar constraint.
alter table public.praticas
  add column if not exists audio_url text,
  add column if not exists duracao_segundos int,
  add column if not exists transcricao text,
  add column if not exists audio_status text not null default 'rascunho'
    check (audio_status in ('rascunho', 'revisada', 'publicada')),
  add column if not exists is_pro boolean not null default false;

comment on column public.praticas.audio_status is
  'Estado de revisão do áudio, independente de praticas.status (texto). Um áudio só aparece em produção quando status = ''publicada'' E audio_status = ''publicada'' E audio_url/duracao_segundos/transcricao preenchidos — decidido na aplicação, não aqui.';

comment on column public.praticas.is_pro is
  'true = exige plano premium para tocar o áudio (checado no servidor da rota da prática, nunca só no cliente). Pode existir uma prática is_pro = false como demonstração gratuita.';

-- RLS e GRANT de public.praticas (0001_init.sql) preservados sem mudança:
-- "qualquer usuaria autenticada le praticas publicadas" continua valendo
-- para a linha inteira, incluindo as novas colunas.

notify pgrst, 'reload schema';
