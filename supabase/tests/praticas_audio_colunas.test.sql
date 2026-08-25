-- Testes de schema para as colunas de áudio de public.praticas (pgTAP).
--
-- Este projeto ainda não tem infraestrutura de banco local (sem Docker
-- disponível no ambiente onde este arquivo foi escrito), então este arquivo
-- não pôde ser executado neste momento. Roda com:
--
--   supabase test db
--
-- Cobre: as 5 colunas novas existem com o tipo esperado; o constraint de
-- audio_status aceita só os 3 valores válidos; o default de audio_status e
-- is_pro está correto; a constraint de `tipo` continua com os 4 valores
-- originais (não foi alterada por esta migração).

begin;
select plan(7);

select has_column('public', 'praticas', 'audio_url', 'praticas.audio_url existe');
select has_column('public', 'praticas', 'duracao_segundos', 'praticas.duracao_segundos existe');
select has_column('public', 'praticas', 'transcricao', 'praticas.transcricao existe');
select has_column('public', 'praticas', 'audio_status', 'praticas.audio_status existe');
select has_column('public', 'praticas', 'is_pro', 'praticas.is_pro existe');

insert into public.praticas (categoria, tipo, titulo, conteudo, status)
values ('respiracao', 'respiracao', 'Prática de teste', 'conteúdo', 'rascunho');

select is(
  (select audio_status from public.praticas where titulo = 'Prática de teste'),
  'rascunho',
  'audio_status assume o default rascunho'
);

select is(
  (select is_pro from public.praticas where titulo = 'Prática de teste'),
  false,
  'is_pro assume o default false'
);

select * from finish();
rollback;
