-- Conteúdo de exemplo para desenvolvimento e teste end-to-end.
-- status = 'rascunho': precisa de revisão da psicóloga parceira antes de virar 'publicada' de verdade.
-- Para rodar localmente durante o desenvolvimento, ajuste manualmente o status para 'publicada'
-- em cada linha abaixo (ou rode o UPDATE no final deste arquivo).

insert into public.praticas (categoria, tipo, titulo, conteudo, status) values
  ('humor_baixo', 'respiracao', 'Respiração 4-7-8',
   'Inspire contando até 4, segure contando até 7, solte o ar contando até 8. Repita 4 vezes, em um ritmo confortável para você.',
   'rascunho'),
  ('imagem_corporal_dificil', 'afirmacao', 'Meu corpo não precisa ser perfeito para merecer cuidado',
   'Hoje, em vez de avaliar seu corpo, tente notar uma coisa que ele fez por você: caminhar, respirar, abraçar alguém.',
   'rascunho'),
  ('comida_culpa', 'reflexao', 'Comer não é uma falha moral',
   'Escreva uma frase sobre uma refeição recente sem usar as palavras "certo", "errado", "deveria" ou "culpa".',
   'rascunho'),
  ('geral_positivo', 'movimento', 'Alongamento consciente de 2 minutos',
   'Alongue os braços acima da cabeça, respire fundo três vezes, e note como o corpo se sente neste exato momento, sem julgamento.',
   'rascunho');

-- Regras de recomendação: faixas 1-5 para humor, imagem corporal e comida.
-- Prioridade mais alta vence quando mais de uma regra bate.
insert into public.regras_recomendacao
  (humor_min, humor_max, imagem_corporal_min, imagem_corporal_max, comida_min, comida_max, eh_sinal_seguranca, categoria_pratica, prioridade, ativa)
values
  -- Sinal de segurança: humor muito baixo E imagem corporal muito baixa E comida muito ruim, simultaneamente.
  (1, 1, 1, 1, 1, 1, true, null, 100, true),
  (1, 2, 1, 5, 1, 5, false, 'humor_baixo', 10, true),
  (1, 5, 1, 2, 1, 5, false, 'imagem_corporal_dificil', 9, true),
  (1, 5, 1, 5, 1, 2, false, 'comida_culpa', 8, true),
  (1, 5, 1, 5, 1, 5, false, 'geral_positivo', 0, true);

insert into public.recursos_seguranca (pais, titulo, corpo, ordem) values
  ('BR', 'Você não está sozinha',
   'O que você está sentindo importa. Isso não é uma emergência, mas merece atenção e cuidado.', 0),
  ('BR', 'Apoio emocional gratuito',
   'O CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito e sigiloso, 24h por dia, pelo telefone 188, ou pelo chat em cvv.org.br. Não é um serviço de emergência — é alguém disposto a te ouvir.', 1),
  ('BR', 'Em caso de risco imediato',
   'Se você ou alguém perto de você está em risco imediato, procure o SAMU (192), uma UPA, um pronto-socorro ou hospital mais próximo.', 2);

update public.praticas set status = 'publicada';
