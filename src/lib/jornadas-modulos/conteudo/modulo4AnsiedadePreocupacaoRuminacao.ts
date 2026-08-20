import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo4AnsiedadePreocupacaoRuminacao: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Diferenciar preocupação produtiva de ruminação improdutiva, reconhecer o ciclo da ansiedade, aprender uma técnica de grounding e praticar separar o que está sob seu controle do que não está, aceitando um pouco mais de incerteza.',
  duracaoEstimadaMinutos: 9,
  explicacao: [
    'Nem toda preocupação é igual. A preocupação produtiva é aquela que leva a uma ação concreta: você identifica um problema real, pensa em passos possíveis e, mesmo que não resolva tudo de uma vez, sai da reflexão com algo para fazer. Já a ruminação — ou preocupação improdutiva — é aquela que gira em círculo: repete o mesmo problema, os mesmos "e se", as mesmas cenas, sem gerar nenhuma ação nova, e geralmente piora o humor em vez de esclarecer alguma coisa. Uma pergunta simples ajuda a diferenciar: "esse pensamento está me levando a algum passo possível, ou só está me fazendo sentir pior sobre algo que eu já sei que existe?"',
    'A ansiedade costuma seguir um ciclo reconhecível: um pensamento ansioso surge ("e se der errado", "e se eu não conseguir"), o corpo reage com sensações físicas (coração acelerado, aperto no peito, tensão), isso puxa um comportamento de evitação (fugir da situação) ou de controle excessivo (checar, perguntar, revisar sem parar), o que traz um alívio de curto prazo — e então a ansiedade volta, muitas vezes mais forte, porque evitar ou controlar demais ensina ao cérebro que aquilo realmente era perigoso o suficiente para merecer tanta cautela. Reconhecer esse ciclo em andamento já ajuda a interromper o piloto automático.',
    'Uma técnica simples para interromper o ciclo no momento em que ele está acontecendo é o grounding pelos sentidos, também chamado de técnica 5-4-3-2-1: procure, ao seu redor, 5 coisas que você consegue ver, 4 coisas que consegue tocar, 3 coisas que consegue ouvir, 2 coisas que consegue cheirar, e 1 coisa que consegue provar (ou algo que você gostaria de provar). O objetivo não é resolver o problema que está te preocupando — é trazer a atenção de volta para o presente e para o corpo, dando um respiro antes de decidir o que fazer a seguir.',
    'Outra ferramenta útil é a resolução de problemas estruturada: quando notar uma preocupação, vale perguntar se ela é sobre algo concreto e solucionável agora, ou sobre algo abstrato, incerto ou fora do seu alcance no momento. Problemas concretos podem ganhar um plano de ação, mesmo pequeno. Preocupações abstratas — sobre o futuro, sobre o que os outros pensam, sobre cenários hipotéticos — normalmente não têm uma "solução" para encontrar, e insistir em resolvê-las mentalmente tende a alimentar a ruminação. Nesses casos, o caminho costuma ser outro: praticar tolerar a incerteza em vez de tentar eliminá-la. A intolerância à incerteza — a dificuldade de aceitar que nem tudo pode ser previsto ou controlado — está associada a mais ansiedade; e a certeza total sobre o futuro raramente é possível, por mais que a mente insista em buscá-la como se fosse.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Renata tinha uma consulta médica marcada e passou a noite anterior repassando mentalmente todos os resultados possíveis, sem chegar a nenhuma conclusão nova — só sentindo o coração acelerar mais a cada rodada de pensamentos (ruminação). Ao perceber o ciclo, ela fez o 5-4-3-2-1: viu o abajur, a cortina, o teto, o celular, a porta; tocou o lençol, o travesseiro, a própria mão, a borda da cama; ouviu o ventilador, um carro passando, sua própria respiração; sentiu o cheiro do creme que tinha passado e o do quarto; e notou o gosto de menta ainda na boca de ter escovado os dentes. Depois, separou: o que estava sob seu controle era levar os exames e chegar no horário; o que estava parcialmente sob controle era como ela se preparava emocionalmente para ouvir o resultado; o que estava totalmente fora de controle era o resultado em si. Ela decidiu, como ação concreta, separar os documentos e dormir mais cedo — e aceitar que o resto ela só saberia no dia seguinte.',
  },
  exercicio: {
    introducao:
      'Pense em algo que está te preocupando agora. Vamos usar o círculo de controle para separar o que depende de você do que não depende — sem a expectativa de que tudo precise estar sob controle.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'controle_total',
        rotulo: 'Nessa situação, o que está totalmente sob o seu controle?',
        placeholder: 'Ex.: como eu me preparo, o que eu levo, o horário que eu saio de casa...',
        maxCaracteres: 500,
      },
      {
        tipo: 'texto_longo',
        id: 'controle_parcial',
        rotulo: 'O que está parcialmente sob o seu controle (você influencia, mas não decide sozinha)?',
        placeholder: 'Ex.: como a conversa vai fluir, a reação da outra pessoa...',
        maxCaracteres: 500,
      },
      {
        tipo: 'texto_longo',
        id: 'fora_de_controle',
        rotulo: 'O que está totalmente fora do seu controle nessa situação?',
        placeholder: 'Ex.: o resultado final, a decisão de outra pessoa, um evento externo...',
        maxCaracteres: 500,
      },
      {
        tipo: 'texto_curto',
        id: 'acao_concreta',
        rotulo:
          'Existe uma pequena ação possível que você pode fazer hoje, relacionada à parte que está sob seu controle? (às vezes tudo está fora de controle, e não ter uma ação agora também é uma resposta válida)',
        placeholder: 'Ex.: separar os documentos, mandar uma mensagem, dormir mais cedo...',
        maxCaracteres: 200,
        opcional: true,
      },
    ],
  },
  feedback: {
    padrao:
      'Obrigada por separar essas partes com calma. Só de distinguir o que está sob seu controle do que não está, você já está saindo do ciclo automático de tentar controlar tudo de uma vez.',
    regras: [
      {
        id: 'fora-de-controle-preenchido',
        condicoes: [{ campoId: 'fora_de_controle', operador: 'preenchido' }],
        texto:
          'Reconhecer o que está fora do seu controle não é desistir — é liberar energia que estava sendo gasta tentando controlar o incontrolável, para usar no que de fato depende de você.',
      },
      {
        id: 'acao-concreta-preenchida',
        condicoes: [{ campoId: 'acao_concreta', operador: 'preenchido' }],
        texto:
          'Ótimo ter encontrado uma ação pequena e concreta — ações assim costumam reduzir mais a ansiedade do que continuar pensando sobre o problema, porque tiram a mente do "e se" e colocam no "o que eu posso fazer agora".',
      },
      {
        id: 'controle-parcial-preenchido',
        condicoes: [{ campoId: 'controle_parcial', operador: 'preenchido' }],
        texto:
          'A parte "parcialmente sob controle" costuma ser a mais desconfortável, porque não é nem totalmente sua nem totalmente alheia — envolve tentar seu melhor sem poder garantir o resultado. Isso é desconfortável, mas é onde a maior parte da vida realmente acontece.',
      },
      {
        id: 'controle-total-preenchido',
        condicoes: [{ campoId: 'controle_total', operador: 'preenchido' }],
        texto:
          'Ter clareza sobre o que está totalmente sob seu controle é um bom ponto de partida — é aí que qualquer ação concreta tende a fazer mais diferença.',
      },
    ],
  },
  acaoPratica:
    'Na próxima vez que perceber uma preocupação girando sem gerar nenhuma ação, experimente o 5-4-3-2-1: nomeie 5 coisas que vê, 4 que toca, 3 que ouve, 2 que cheira e 1 que prova. Depois, pergunte-se se há algum passo pequeno e concreto que você pode dar agora — e se não houver, tudo bem também.',
  resumo: [
    'Preocupação produtiva leva a uma ação concreta; ruminação gira em círculo sem gerar solução.',
    'O ciclo da ansiedade envolve pensamento, sensação física, evitação ou controle excessivo, alívio curto e retorno da ansiedade.',
    'A técnica 5-4-3-2-1 usa os cinco sentidos para trazer a atenção de volta ao presente.',
    'Separar o que está sob controle, parcialmente sob controle e fora de controle ajuda a direcionar energia com mais realismo.',
    'Tolerar um pouco de incerteza costuma ajudar mais do que tentar eliminar toda incerteza, que raramente é possível.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'A preocupação é um processo cognitivo específico, ligado a tentativas mentais de evitar ou se preparar para ameaças futuras, e está associada a respostas afetivas, fisiológicas e comportamentais características.',
      referencia:
        'Borkovec, T. D., Ray, W. J., & Stöber, J. (1998). Worry: A cognitive phenomenon intimately linked to affective, physiological, and interpersonal behavioral processes. Cognitive Therapy and Research, 22(6), 561–576.',
      link: 'https://doi.org/10.1023/a:1018790003416',
      aplicacao:
        'Fundamenta a descrição do ciclo da ansiedade e a diferenciação entre preocupação produtiva e ruminação apresentadas na explicação do módulo.',
      limitacoes:
        'É um artigo teórico e de revisão de processos cognitivos e fisiológicos, não um ensaio clínico controlado que testou uma intervenção específica.',
    },
    {
      afirmacao:
        'A ruminação — repetir mentalmente um problema sem chegar a uma solução — está associada a sintomas depressivos e a quadros mistos de ansiedade e depressão, tendendo a prolongar o sofrimento em vez de resolvê-lo.',
      referencia:
        'Nolen-Hoeksema, S. (2000). The role of rumination in depressive disorders and mixed anxiety/depressive symptoms. Journal of Abnormal Psychology, 109(3), 504–511.',
      link: 'https://doi.org/10.1037/0021-843X.109.3.504',
      aplicacao:
        'Sustenta a distinção do módulo entre preocupação produtiva e ruminação improdutiva, e a ideia de que ruminar tende a piorar o humor sem gerar solução.',
      limitacoes:
        'É um estudo focado em sintomas depressivos e mistos, não uma medida diagnóstica; ruminação e preocupação são processos relacionados, mas não idênticos, e os achados não se aplicam automaticamente a todo tipo de preocupação ansiosa.',
    },
    {
      afirmacao:
        'A dificuldade de tolerar a incerteza (intolerância à incerteza) está associada a mais sintomas de ansiedade, incluindo ansiedade generalizada.',
      referencia:
        'Gentes, E. L., & Ruscio, A. M. (2011). A meta-analysis of the relation of intolerance of uncertainty to symptoms of generalized anxiety disorder, major depressive disorder, and obsessive–compulsive disorder. Clinical Psychology Review, 31(6), 923–933.',
      link: 'https://doi.org/10.1016/j.cpr.2011.05.001',
      aplicacao:
        'Fundamenta a orientação do módulo sobre praticar aceitar a incerteza em vez de tentar controlar tudo, especialmente na parte do exercício sobre o que está fora de controle.',
      limitacoes:
        'É uma meta-análise correlacional — não estabelece que a intolerância à incerteza causa ansiedade, só que as duas aparecem associadas nos estudos analisados.',
    },
  ],
  avisoSeguranca:
    'Se a ansiedade estiver presente quase o tempo todo, atrapalhando o dia a dia de forma incapacitante, ou vier acompanhada de crises intensas (como falta de ar, tontura forte ou pânico), isso vale uma conversa com um profissional de saúde mental — este exercício é um recurso de apoio, não substitui terapia ou acompanhamento clínico.',
  camposParaTriagem: ['controle_total', 'controle_parcial', 'fora_de_controle'],
};
