-- Três roteiros de exemplo para práticas em áudio (respiração, autocompaixão,
-- aterramento). Entram como rascunho de texto E de áudio — não aparecem em
-- produção (a query de listagem e a página de detalhe só mostram práticas
-- com status='publicada' e audio_status='publicada') até revisão da
-- psicóloga responsável e gravação real do áudio. Nenhum arquivo de áudio
-- existe ainda: audio_url fica null propositalmente.
insert into public.praticas (categoria, tipo, titulo, conteudo, status, audio_status, is_pro)
values
  (
    'respiracao',
    'respiracao',
    'Respiração para desacelerar',
    E'Encontre uma posição em que seu corpo possa ficar apoiado — sentada ou deitada, como for mais confortável para você agora.\n\n'
    || E'Quando quiser, feche os olhos ou deixe o olhar suave, voltado para baixo.\n\n'
    || E'Perceba o ar entrando pelo nariz. Sem forçar, sem pressa. Só percebendo.\n\n'
    || E'Agora, inspire contando até quatro, devagar.\n\n'
    || E'Segure o ar por um instante breve — só o que for confortável para você.\n\n'
    || E'Solte o ar contando até seis, deixando os ombros afundarem um pouco.\n\n'
    || E'Repita esse ciclo algumas vezes, no seu próprio ritmo. Não existe forma certa de fazer isso — existe a forma que funciona para você hoje.\n\n'
    || E'Se a mente se distrair, tudo bem. Perceba, e volte a atenção para o ar entrando e saindo.\n\n'
    || E'Esta pausa é sua. Ela não muda o que está acontecendo lá fora, mas pode te ajudar a chegar até o próximo momento com um pouco mais de espaço dentro de você.\n\n'
    || E'Se em algum momento você sentir que precisa de mais apoio do que uma pausa pode oferecer, procurar um profissional de saúde é um passo de cuidado — não um sinal de que você não deu conta.',
    'rascunho',
    'rascunho',
    false
  ),
  (
    'autocompaixao',
    'reflexao',
    'Uma pausa de autocompaixão',
    E'Este é um convite para tratar a si mesma como você trataria alguém que você ama, quando essa pessoa está passando por um momento difícil.\n\n'
    || E'Comece só percebendo como você está agora, sem tentar mudar nada ainda. Nomeie para si mesma, em silêncio: "este é um momento difícil" — ou as palavras que fizerem sentido para você.\n\n'
    || E'Lembre-se: dificuldade faz parte da experiência de ser humana. Você não está sozinha nisso, mesmo quando parece que está.\n\n'
    || E'Agora, se quiser, coloque a mão sobre o peito, ou em outro lugar que traga uma sensação de acolhimento. Sinta o calor da sua própria mão.\n\n'
    || E'Pergunte-se, com gentileza: "do que eu preciso ouvir agora?" Pode ser "eu posso ser gentil comigo", "isso vai passar", "eu estou fazendo o que consigo com o que tenho agora".\n\n'
    || E'Não é sobre resolver o que está difícil neste instante. É sobre não se tratar com dureza por estar difícil.\n\n'
    || E'Quando fizer sentido para você, devagar, volte a atenção para o espaço ao seu redor.\n\n'
    || E'Esta prática é um gesto de cuidado, não um tratamento e não substitui acompanhamento psicológico. Se o que você está sentindo persiste ou pesa mais do que você consegue segurar sozinha, buscar apoio profissional é um cuidado válido e importante.',
    'rascunho',
    'rascunho',
    true
  ),
  (
    'aterramento',
    'movimento',
    'Aterramento pelos sentidos',
    E'Esta prática usa os sentidos para te ajudar a chegar ao momento presente. Você pode fazer sentada, em pé ou deitada — onde estiver, como estiver.\n\n'
    || E'Olhe ao redor e note, em silêncio, cinco coisas que você consegue ver. Não precisa ser nada especial — uma cor, uma sombra, um objeto qualquer.\n\n'
    || E'Agora, perceba quatro coisas que você consegue sentir tocando seu corpo: o tecido da roupa, o apoio dos pés no chão, a temperatura do ar.\n\n'
    || E'Perceba três sons ao seu redor, próximos ou distantes. Só perceba, sem julgar se são bons ou ruins.\n\n'
    || E'Se possível, note dois cheiros — mesmo que sutis, mesmo que seja só o ar.\n\n'
    || E'E, se fizer sentido, perceba um sabor na sua boca neste momento.\n\n'
    || E'Devagar, volte a atenção para a sua respiração, e para o espaço em que você está.\n\n'
    || E'Você pode repetir essa sequência quantas vezes quiser, na ordem que for mais útil para você.\n\n'
    || E'Esta prática ajuda a reconectar com o momento presente, mas não é um recurso de emergência nem substitui ajuda profissional. Em caso de crise ou risco imediato, procure o espaço "Preciso de ajuda agora" da Rose ou um serviço de emergência local.',
    'rascunho',
    'rascunho',
    true
  );

notify pgrst, 'reload schema';
