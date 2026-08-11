-- Jornada de exemplo para desenvolvimento e teste de ponta a ponta.
-- Conteúdo placeholder: precisa de revisão da psicóloga parceira antes de virar
-- conteúdo real, igual ao restante do conteúdo em supabase/seed.sql.

insert into public.jornadas (id, titulo, descricao, duracao_dias, status) values
  ('11111111-1111-1111-1111-111111111111', 'Reconstruindo minha autoestima', 'Uma jornada de 7 dias para fortalecer sua relação consigo mesma.', 7, 'rascunho');

insert into public.jornada_atividades (jornada_id, numero_dia, titulo, conteudo) values
  ('11111111-1111-1111-1111-111111111111', 1, 'Dia 1: Um começo gentil', 'Hoje, escreva três coisas simples que seu corpo fez por você essa semana.'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Dia 2: Sem comparação', 'Note uma vez hoje em que você se comparou com alguém, e substitua o pensamento por algo gentil sobre si mesma.'),
  ('11111111-1111-1111-1111-111111111111', 3, 'Dia 3: O espelho', 'Olhe no espelho por 30 segundos sem julgamento — apenas observe, sem comentar.'),
  ('11111111-1111-1111-1111-111111111111', 4, 'Dia 4: Respiração e pausa', 'Respire fundo 5 vezes, contando até 4 na inspiração e até 6 na expiração.'),
  ('11111111-1111-1111-1111-111111111111', 5, 'Dia 5: Uma carta pra você', 'Escreva uma frase curta que você gostaria de ouvir de alguém que te ama.'),
  ('11111111-1111-1111-1111-111111111111', 6, 'Dia 6: Pequena vitória', 'Lembre de algo que você conseguiu fazer essa semana, por menor que pareça.'),
  ('11111111-1111-1111-1111-111111111111', 7, 'Dia 7: Fechando com cuidado', 'Reflita sobre como foi essa semana e escreva uma coisa que quer continuar praticando.');

-- Publica a jornada de teste para uso em desenvolvimento — em produção real, só
-- publicar depois da revisão da psicóloga (mesmo padrão do UPDATE em seed.sql).
update public.jornadas set status = 'publicada' where id = '11111111-1111-1111-1111-111111111111';
