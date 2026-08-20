import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo1EntendendoEmocoes: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender para que servem as emoções e treinar reconhecer, nomear e diferenciar o que você sente — emoção, pensamento, sensação física e comportamento — em vez de misturar tudo em "estou mal".',
  duracaoEstimadaMinutos: 8,
  explicacao: [
    'Emoções não são um defeito nem um exagero: são sinais rápidos que o corpo e a mente produzem para te avisar de algo importante — uma necessidade, um limite, um risco, uma conexão. Medo sinaliza ameaça, raiva costuma sinalizar que um limite foi ultrapassado, tristeza costuma sinalizar perda, alegria costuma sinalizar que algo te faz bem. Nenhuma emoção é "errada" de se sentir; o que varia é o que fazemos com ela.',
    'É comum confundir quatro coisas diferentes: a emoção em si (ex.: ansiedade), o pensamento que vem junto (ex.: "vou fazer besteira"), a sensação física (ex.: aperto no peito, mãos suando) e o comportamento que ela puxa (ex.: evitar a situação). Elas se influenciam, mas são partes diferentes — separar essas partes é o primeiro passo para lidar melhor com qualquer uma delas.',
    'Quanto mais específico o nome que você dá para uma emoção — "frustração" em vez de só "mal", "decepção" em vez de só "ruim" — mais fácil fica entender do que você precisa naquele momento. Pesquisa em psicologia chama isso de diferenciação emocional, e ela está associada a formas mais saudáveis de lidar com emoções difíceis.',
    'Por trás de quase toda emoção intensa existe uma necessidade — de descanso, de segurança, de ser ouvida, de conexão, de reconhecimento, de espaço. Nem sempre dá para atender a necessidade na hora, mas só de identificá-la você já ganha clareza sobre o que fazer a seguir.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Marina recebeu uma mensagem da chefe pedindo para refazer um relatório "com mais cuidado da próxima vez". Sensação física: estômago apertado, rosto quente. Pensamento automático: "ela acha que eu sou incompetente". Emoção: vergonha, com um pouco de ansiedade misturada, intensidade 7 de 10. Comportamento: releu a mensagem cinco vezes e evitou responder por duas horas. Ao nomear separadamente cada parte, Marina percebeu que a necessidade por trás da vergonha era de sentir que seu trabalho tem valor — e que isso era diferente de "ser incompetente". Ela decidiu responder pedindo um exemplo concreto do que a chefe esperava, em vez de ficar remoendo em silêncio.',
  },
  exercicio: {
    introducao:
      'Pense em uma situação recente (das últimas 48 horas, se possível) em que você sentiu uma emoção com alguma intensidade. Vamos separar as partes, uma de cada vez.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'situacao',
        rotulo: 'O que aconteceu? Descreva a situação de forma simples e concreta.',
        placeholder: 'Ex.: recebi uma mensagem da minha chefe pedindo para refazer um relatório...',
        maxCaracteres: 600,
      },
      {
        tipo: 'escolha_unica',
        id: 'emocao',
        rotulo: 'Qual emoção mais se aproxima do que você sentiu?',
        opcoes: [
          'Tristeza',
          'Raiva',
          'Medo',
          'Vergonha',
          'Culpa',
          'Alegria',
          'Alívio',
          'Surpresa',
          'Nojo/repulsa',
          'Outra ou uma mistura de várias',
        ],
      },
      {
        tipo: 'escala',
        id: 'intensidade',
        rotulo: 'Em que intensidade você sentiu essa emoção?',
        min: 0,
        max: 10,
        rotuloMin: 'Bem leve',
        rotuloMax: 'Muito intensa',
      },
      {
        tipo: 'multipla_escolha',
        id: 'sensacoes_fisicas',
        rotulo: 'Que sensações físicas vieram junto? (pode marcar mais de uma)',
        opcoes: [
          'Aperto no peito ou na garganta',
          'Estômago embrulhado ou apertado',
          'Coração acelerado',
          'Tensão nos ombros ou mandíbula',
          'Rosto quente ou corado',
          'Cansaço ou peso no corpo',
          'Não percebi nenhuma sensação clara',
        ],
      },
      {
        tipo: 'texto_longo',
        id: 'pensamentos',
        rotulo: 'Que pensamentos passaram pela sua cabeça nesse momento?',
        placeholder: 'Ex.: "ela acha que eu sou incompetente", "eu devia ter percebido antes"...',
        maxCaracteres: 600,
        opcional: true,
      },
      {
        tipo: 'escolha_unica',
        id: 'necessidade',
        rotulo: 'Olhando agora, qual necessidade parece estar por trás dessa emoção?',
        opcoes: [
          'Descanso',
          'Segurança',
          'Ser ouvida ou compreendida',
          'Reconhecimento pelo que eu faço',
          'Conexão com alguém',
          'Espaço e autonomia',
          'Conforto',
          'Ainda não sei identificar',
        ],
      },
    ],
  },
  feedback: {
    padrao:
      'Obrigada por colocar isso em palavras — só o gesto de separar situação, emoção, corpo e pensamento já é um exercício de autoconhecimento, mesmo quando a clareza ainda não é total.',
    regras: [
      {
        id: 'intensidade-alta',
        condicoes: [{ campoId: 'intensidade', operador: 'maior_ou_igual', valor: 8 }],
        texto:
          'Uma intensidade tão alta faz sentido diante do que você descreveu — emoções fortes não são exagero, são o corpo sinalizando que algo importante está em jogo. Se ainda estiver muito presente, pode ajudar respirar fundo algumas vezes antes de seguir.',
      },
      {
        id: 'emocao-vergonha',
        condicoes: [{ campoId: 'emocao', operador: 'igual', valor: 'Vergonha' }],
        texto:
          'A vergonha costuma aparecer quando sentimos que algo em nós pode ser julgado — mas o que os outros pensam nem sempre reflete o que realmente somos. Vale perguntar: essa vergonha está falando sobre o que eu fiz, ou sobre quem eu acho que sou?',
      },
      {
        id: 'emocao-raiva',
        condicoes: [{ campoId: 'emocao', operador: 'igual', valor: 'Raiva' }],
        texto:
          'A raiva costuma aparecer quando um limite importante foi ultrapassado. Ela não precisa ser "resolvida" imediatamente — só reconhecê-la já ajuda a decidir com mais calma o que fazer com ela.',
      },
      {
        id: 'emocao-medo',
        condicoes: [{ campoId: 'emocao', operador: 'igual', valor: 'Medo' }],
        texto:
          'O medo é o corpo tentando te proteger de algo que parece ameaçador — mesmo quando a ameaça é incerta ou não vai se concretizar. Nomear o medo específico (medo de quê, exatamente?) costuma reduzir um pouco o peso dele.',
      },
      {
        id: 'necessidade-nao-sei',
        condicoes: [{ campoId: 'necessidade', operador: 'igual', valor: 'Ainda não sei identificar' }],
        texto:
          'Tudo bem não saber ainda — identificar a necessidade por trás de uma emoção é uma habilidade que se desenvolve com prática, não algo que se acerta de primeira. Só de ter parado para se perguntar isso, você já está treinando.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, quando notar uma emoção (mesmo pequena), tente nomeá-la com uma palavra específica — não só "bem" ou "mal". Se quiser, complete mentalmente: "estou sentindo ___, e talvez o que eu precise agora seja ___".',
  resumo: [
    'Emoções são sinais com função, não defeitos — elas indicam necessidades, limites ou riscos.',
    'Emoção, pensamento, sensação física e comportamento são partes diferentes de uma mesma experiência.',
    'Nomear a emoção com mais precisão ajuda a entender melhor o que fazer a seguir.',
    'Quase toda emoção intensa aponta para uma necessidade — identificá-la já é um passo de cuidado, mesmo sem conseguir atendê-la na hora.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'Emoções cumprem uma função adaptativa: preparam o corpo e orientam o comportamento diante de eventos relevantes (ex.: medo sinaliza ameaça, raiva sinaliza violação de limites).',
      referencia: 'Gross, J. J. (1998). The Emerging Field of Emotion Regulation: An Integrative Review. Review of General Psychology, 2(3), 271–299.',
      link: 'https://doi.org/10.1037/1089-2680.2.3.271',
      aplicacao:
        'Base para a explicação de que emoções têm função e para o modelo de que emoção, pensamento e comportamento são processos relacionados mas distintos.',
      limitacoes:
        'É um artigo teórico de revisão, não um estudo experimental isolado; o modelo processual de regulação emocional descrito é amplamente aceito, mas simplifica um fenômeno multifatorial.',
    },
    {
      afirmacao:
        'Nomear emoções com mais precisão e especificidade (diferenciação emocional) está associado a formas mais adaptativas de lidar com experiências negativas.',
      referencia:
        'Kashdan, T. B., Barrett, L. F., & McKnight, P. E. (2015). Unpacking Emotion Differentiation: Transforming Unpleasant Experience by Perceiving Distinctions in Negativity. Current Directions in Psychological Science, 24(1), 10–16.',
      link: 'https://doi.org/10.1177/0963721414550708',
      aplicacao: 'Fundamenta o exercício de escolher uma emoção específica em vez de ficar em "bem/mal", e a orientação da explicação sobre nomear com precisão.',
      limitacoes:
        'A relação é correlacional em boa parte dos estudos citados nessa revisão — diferenciação emocional está associada a, mas não comprovadamente causa isoladamente, melhor regulação emocional.',
    },
  ],
  avisoSeguranca:
    'Se, ao descrever a situação, vier à tona algo como pensamentos de se machucar, violência ou uma situação de abuso, isso merece um cuidado maior do que este exercício sozinho pode oferecer — role até o final para ver como buscar apoio.',
  camposParaTriagem: ['situacao', 'pensamentos'],
};
