import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo8HabitosAutocuidadoPossivel: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender por que o humor baixo torna mais difícil começar qualquer coisa (mesmo o que normalmente traz bem-estar), por que esperar "sentir vontade" antes de agir costuma manter você presa, e treinar escolher uma ação de autocuidado pequena, específica e realista — diferente de metas grandes e vagas ou de rotinas que viram mais uma cobrança.',
  duracaoEstimadaMinutos: 8,
  explicacao: [
    'Quando o humor está baixo, o corpo e a mente entram numa espécie de economia de energia: fica mais difícil se concentrar, iniciar tarefas, e até coisas que normalmente trazem prazer podem parecer sem graça ou cansativas demais para começar. Isso não é falta de força de vontade — é uma consequência conhecida e esperada de estados de humor baixo, que reduzem tanto a energia disponível quanto a motivação percebida para agir. Reconhecer isso tira um peso: se hoje está mais difícil começar, o problema não é você ser "preguiçosa" ou "fraca".',
    'Existe uma armadilha comum nessa situação: esperar sentir vontade antes de agir. Faz sentido pensar assim — "vou tomar banho quando eu estiver com mais disposição", "vou ligar para minha amiga quando eu estiver melhor". O problema é que, no humor baixo, a vontade tende a não chegar primeiro. Na maioria das vezes, é o contrário: a ação pequena vem primeiro, e um pouco de energia e disposição aparece depois, como consequência de ter feito algo, não como pré-requisito. Esse princípio — agir mesmo sem vontade, em passos pequenos, para gerar movimento — é chamado de ativação comportamental, e é uma das ideias mais estudadas e úteis para sair do ciclo de "não faço nada porque não tenho vontade, e não tenho vontade porque não faço nada".',
    'Por isso, o tamanho da ação importa mais do que parece. Metas grandes e vagas como "vou cuidar mais de mim" ou "preciso mudar minha rotina inteira" costumam falhar justamente porque exigem energia que talvez não esteja disponível agora — e quando não são cumpridas, viram mais uma prova (falsa) de que "você não consegue nada". Uma ação pequena, específica e com hora marcada — "vou tomar um copo de água e ficar 5 minutos no sol na varanda, depois do almoço" — é mais fácil de começar, mais fácil de cumprir, e cada pequena vitória vai reconstruindo, aos poucos, a sensação de que agir é possível.',
    'Vale diferenciar também autocuidado genuíno de cobrança disfarçada de autocuidado. Autocuidado genuíno é algo que realmente recarrega você, mesmo que pequeno e mesmo que imperfeito — um banho mais demorado, ouvir uma música, mandar uma mensagem para alguém querida. Cobrança disfarçada de autocuidado é quando a "rotina de cuidado" vira ela mesma uma fonte de pressão: uma lista rígida de 10 passos (skincare completo, exercício, meditação, diário, leitura...) que, quando não é cumprida por inteiro, gera culpa em vez de bem-estar. Se o "autocuidado" está te deixando mais exausta ou mais culpada, ele deixou de cumprir sua função — e o tamanho ou a rigidez dele é o primeiro lugar para olhar.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Débora está há alguns dias se sentindo sem energia, e vinha adiando "organizar a vida" — arrumar o quarto, responder mensagens atrasadas, voltar a caminhar. Toda vez que pensava nisso como um bloco só, sentia um cansaço ainda maior e desistia antes de começar. Um dia, em vez de pensar em "organizar a vida", ela escolheu uma coisa só: separar a louça do café da manhã, por 5 minutos, logo depois de acordar. Não sentiu vontade nenhuma antes de começar — só decidiu tentar. No meio da tarefa, notou que não estava tão ruim quanto imaginava, e depois de terminar sentiu um alívio pequeno, mas real. No dia seguinte, escolheu outra coisa pequena: mandar uma mensagem de voz para uma amiga, só dizendo "oi, saudade, sumida por uns dias". Nenhuma das duas ações resolveu o cansaço de Débora, mas cada uma foi uma prova pequena de que agir, mesmo sem vontade, ainda era possível.',
  },
  exercicio: {
    introducao:
      'Vamos escolher uma ação de autocuidado pequena e realista para tentar hoje ou amanhã — pequena o suficiente para começar mesmo sem muita energia, e específica o suficiente para não virar só mais uma intenção vaga.',
    campos: [
      {
        tipo: 'escolha_unica',
        id: 'categoria_atividade',
        rotulo: 'Que tipo de atividade pequena você quer tentar?',
        opcoes: [
          'Descanso (ex.: cochilo curto, ficar deitada sem culpa, silêncio)',
          'Movimento (ex.: alongar, caminhar alguns minutos, dançar uma música)',
          'Conexão social (ex.: mandar uma mensagem, ligar para alguém, ver alguém pessoalmente)',
          'Algo sensorial ou prazeroso (ex.: banho mais demorado, música, cheiro, comida gostosa)',
          'Organizar um pequeno espaço (ex.: arrumar a cama, lavar a louça, limpar a mesa)',
          'Outra coisa (vou descrever)',
        ],
      },
      {
        tipo: 'texto_curto',
        id: 'descricao_atividade',
        rotulo: 'Descreva especificamente o que você vai tentar fazer.',
        placeholder: 'Ex.: tomar um banho mais demorado, com música, por uns 10 minutos',
        maxCaracteres: 200,
        opcional: true,
      },
      {
        tipo: 'texto_curto',
        id: 'momento_planejado',
        rotulo: 'Quando você pretende tentar isso? (dia e horário ou momento aproximado)',
        placeholder: 'Ex.: hoje à noite, depois do jantar',
        maxCaracteres: 120,
      },
      {
        tipo: 'escala',
        id: 'dificuldade_esperada',
        rotulo: 'Numa escala de 0 a 10, o quão difícil você imagina que vai ser começar?',
        min: 0,
        max: 10,
        rotuloMin: 'Bem fácil',
        rotuloMax: 'Muito difícil',
      },
      {
        tipo: 'escala',
        id: 'humor_antes',
        rotulo: '(Preencha antes de tentar, se quiser) Como está seu humor agora?',
        min: 0,
        max: 10,
        rotuloMin: 'Bem baixo',
        rotuloMax: 'Bem bom',
        opcional: true,
      },
      {
        tipo: 'escala',
        id: 'humor_depois',
        rotulo: '(Preencha depois de tentar) Como você se sentiu depois de fazer a atividade?',
        min: 0,
        max: 10,
        rotuloMin: 'Bem baixo',
        rotuloMax: 'Bem bom',
        opcional: true,
      },
    ],
  },
  feedback: {
    padrao:
      'Escolher uma ação pequena e específica, em vez de uma meta grande e vaga, já é uma forma de cuidado — não porque a ação em si é mágica, mas porque ela é possível de cumprir mesmo num dia difícil.',
    regras: [
      {
        id: 'dificuldade-alta',
        condicoes: [{ campoId: 'dificuldade_esperada', operador: 'maior_ou_igual', valor: 8 }],
        texto:
          'Se até essa ação pequena parece muito difícil de começar, talvez ela ainda não esteja pequena o suficiente — tudo bem diminuir mais. Às vezes o primeiro passo real é menor do que a gente imagina: não "tomar banho", mas só "entrar no banheiro"; não "sair para caminhar", mas só "calçar o tênis".',
      },
      {
        id: 'dificuldade-baixa',
        condicoes: [{ campoId: 'dificuldade_esperada', operador: 'menor_ou_igual', valor: 3 }],
        texto:
          'Parece uma ação bem acessível para você agora — ótimo ponto de partida. Cumprir algo pequeno e possível vale mais, para reconstruir energia, do que mirar em algo grande que fica só na intenção.',
      },
      {
        id: 'categoria-descanso',
        condicoes: [{ campoId: 'categoria_atividade', operador: 'igual', valor: 'Descanso (ex.: cochilo curto, ficar deitada sem culpa, silêncio)' }],
        texto:
          'Descansar sem culpa também é uma forma de cuidado, mesmo que não pareça "produtivo". Você não precisa justificar ou render nada durante esse tempo.',
      },
      {
        id: 'categoria-conexao',
        condicoes: [{ campoId: 'categoria_atividade', operador: 'igual', valor: 'Conexão social (ex.: mandar uma mensagem, ligar para alguém, ver alguém pessoalmente)' }],
        texto:
          'Buscar conexão, mesmo em pequena dose, costuma ajudar bastante quando o humor está baixo — nem que seja uma mensagem curta. Não precisa ser uma conversa longa ou "perfeita" para contar.',
      },
      {
        id: 'humor-melhorou',
        condicoes: [
          { campoId: 'humor_antes', operador: 'preenchido' },
          { campoId: 'humor_depois', operador: 'preenchido' },
        ],
        texto:
          'Obrigada por registrar o antes e o depois — comparar os dois números, com o tempo, ajuda a perceber que agir (mesmo sem vontade) costuma mudar como você se sente, ainda que nem sempre de forma grande ou imediata.',
      },
      {
        id: 'outra-atividade',
        condicoes: [{ campoId: 'categoria_atividade', operador: 'igual', valor: 'Outra coisa (vou descrever)' }],
        texto:
          'Você conhece melhor do que ninguém o que costuma te fazer bem — confiar nessa escolha própria também faz parte do processo.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, tente cumprir a ação pequena que você planejou aqui, mesmo que não sinta vontade na hora de começar. Se não der certo hoje, tudo bem — escolha de novo amanhã, talvez uma versão ainda menor.',
  resumo: [
    'O humor baixo reduz energia e motivação — isso não é falta de força de vontade.',
    'A motivação geralmente vem depois de começar a agir, não antes: não é preciso "sentir vontade" para dar o primeiro passo.',
    'Ações pequenas, específicas e com hora marcada funcionam melhor do que metas grandes e vagas.',
    'Autocuidado genuíno recarrega, mesmo que pequeno; uma rotina rígida que vira fonte de culpa deixou de cumprir essa função.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'Hábitos e comportamentos de saúde (incluindo os de autocuidado) se formam e se sustentam de forma mais consistente quando são construídos como ações pequenas e específicas, repetidas em contexto, em vez de intenções amplas.',
      referencia:
        'Gardner, B. (2015). A review and analysis of the use of \'habit\' in understanding, predicting and influencing health-related behaviour. Health Psychology Review, 9(3), 277–295.',
      link: 'https://doi.org/10.1080/17437199.2013.876238',
      aplicacao:
        'Fundamenta a orientação de escolher uma ação pequena e concreta (categoria + descrição + horário) em vez de uma meta vaga como "cuidar mais de mim".',
      limitacoes:
        'É uma revisão conceitual sobre a definição e o uso do termo "hábito" na pesquisa, não um ensaio testando uma intervenção específica; a formação de hábito varia muito entre pessoas e entre tipos de comportamento, então não há garantia de que uma ação pequena vire hábito automaticamente.',
    },
    {
      afirmacao:
        'Incentivar a pessoa a se engajar em atividades (ativação comportamental), mesmo sem esperar sentir vontade antes, é eficaz para melhorar sintomas de humor baixo.',
      referencia: 'Cuijpers, P., van Straten, A., & Warmerdam, L. (2007). Behavioral activation treatments of depression: A meta-analysis. Clinical Psychology Review, 27(3), 318–326.',
      link: 'https://doi.org/10.1016/j.cpr.2006.11.001',
      aplicacao:
        'Fundamenta a explicação central do módulo: a ideia de que a ação tende a vir antes da motivação, e de que agir em passos pequenos ajuda a sair do ciclo de humor baixo e inatividade.',
      limitacoes:
        'É uma meta-análise de tratamentos estruturados de ativação comportamental conduzidos por profissionais para depressão; este módulo usa o princípio geral de forma leve e educativa, em formato de autoajuda guiada, não como substituto de um tratamento formal ou de acompanhamento profissional.',
    },
  ],
  camposParaTriagem: ['descricao_atividade'],
};
