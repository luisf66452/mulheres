import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo3AutocompaixaoAutocritica: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender a diferença entre autocompaixão, autoestima e autocomplacência, reconhecer como a autocrítica dura tende a prejudicar (não melhorar) o bem-estar e a motivação, e praticar os três elementos da autocompaixão diante de uma situação real.',
  duracaoEstimadaMinutos: 8,
  explicacao: [
    'É fácil confundir autocompaixão com autoestima ou com "se dar bem" sem responsabilidade, mas são coisas diferentes. Autoestima costuma depender de avaliação e comparação — de achar que você é boa, competente ou valiosa em relação a algum padrão ou às outras pessoas; ela sobe quando você vai bem e desaba quando você erra ou se compara desfavoravelmente. Autocompaixão não depende de desempenho: é a forma como você trata a si mesma quando erra, sofre ou não alcança o que queria — independentemente de você "merecer" ou não. E autocompaixão também não é autocomplacência: não é dar de ombros para os próprios erros, evitar responsabilidade ou se poupar de qualquer desconforto. É reconhecer o erro ou a dificuldade com honestidade, mas sem se atacar por isso — o que, na prática, costuma deixar mais fácil (não mais difícil) assumir responsabilidade e mudar de rumo.',
    'Existe uma crença comum de que autocrítica dura funciona como um "chicote motivacional" — que se você não se cobrar com dureza, vai relaxar e piorar. Mas o efeito observado costuma ser o contrário: autocrítica excessiva tende a aumentar ansiedade e desânimo, alimentar procrastinação e medo de errar, e piorar a performance ao longo do tempo, não melhorá-la. Isso faz sentido quando você pensa em quem cresce mais rápido — quem tem alguém do lado dizendo "você é péssima, vai errar de novo", ou quem tem alguém dizendo "isso foi difícil, o que dá para ajustar da próxima vez"? O segundo tende a manter a pessoa tentando; o primeiro tende a fazer ela desistir ou evitar tentar de novo.',
    'A pesquisadora Kristin Neff descreve a autocompaixão a partir de três elementos que trabalham juntos. O primeiro é gentileza consigo mesma, em vez de autojulgamento: falar consigo do jeito que você falaria com alguém que se importa de verdade, em vez de usar a voz mais dura que você conhece. O segundo é humanidade compartilhada, em vez de isolamento: lembrar que errar, sofrer, ter limites e falhar em algo fazem parte da experiência humana comum — não é uma falha exclusivamente sua que te separa de todo mundo, é algo que atravessa a vida de qualquer pessoa, mesmo que ela não mostre. O terceiro é atenção plena (mindfulness), em vez de superidentificação com o sofrimento: reconhecer a dor ou a frustração pelo que ela é, sem exagerá-la nem tentar empurrá-la para longe — sem se afogar nela a ponto de ela virar sua identidade inteira.',
    'Nenhum desses três elementos exige que você minimize o que aconteceu ou finja que está tudo bem quando não está. Autocompaixão não é positividade forçada — é justiça: tratar a si mesma com o mesmo padrão de cuidado que você ofereceria a alguém que você ama, na mesma situação, sem inflar nem apagar o que de fato aconteceu.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Camila errou uma pergunta importante numa entrevista de emprego e saiu repetindo mentalmente "sou burra, estraguei tudo, nunca vou conseguir uma vaga boa assim". Ao notar esse padrão, ela tentou aplicar os três elementos: gentileza — em vez de "sou burra", reconheceu "eu me atrapalhei numa pergunta, isso aconteceu, e ainda assim não define minha inteligência"; humanidade compartilhada — lembrou que praticamente todo mundo que já fez entrevista já travou em alguma pergunta, isso não é uma falha rara e vergonhosa, é comum; atenção plena — permitiu sentir a frustração sem inflar ("isso foi chato e frustrante", não "isso prova que eu sou um fracasso"). Isso não fez a decepção sumir, mas evitou que uma entrevista ruim virasse uma sentença sobre o valor dela inteira.',
  },
  exercicio: {
    introducao:
      'Pense em algo que você tem dito para si mesma com dureza ultimamente. Vamos experimentar reescrever isso com o mesmo padrão de cuidado que você ofereceria a alguém que você ama — sem fingir que está tudo bem, só sendo justa consigo mesma.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'frase_autocritica',
        rotulo: 'Escreva uma frase autocrítica real que você costuma pensar sobre si mesma.',
        placeholder: 'Ex.: "eu sempre estrago tudo", "eu sou incapaz de..."',
        maxCaracteres: 400,
      },
      {
        tipo: 'texto_longo',
        id: 'reescrita_compassiva',
        rotulo:
          'Agora reescreva essa mesma situação como se estivesse falando com uma amiga querida que passou por exatamente isso. Isso não é fingir que está tudo bem — é ser justa e gentil consigo mesma como você seria com alguém que você ama, reconhecendo o que de fato aconteceu, sem se atacar por isso.',
        placeholder: 'Ex.: "isso foi difícil, e é compreensível ter reagido assim..."',
        maxCaracteres: 500,
      },
      {
        tipo: 'escolha_unica',
        id: 'elemento_mais_dificil',
        rotulo:
          'Dos três elementos da autocompaixão, qual parece mais difícil para você agora: gentileza consigo mesma, lembrar que isso é parte da experiência humana comum, ou observar o sofrimento sem se afogar nele?',
        opcoes: [
          'Gentileza consigo mesma (em vez de me julgar)',
          'Humanidade compartilhada (lembrar que não sou a única)',
          'Atenção plena (observar sem exagerar nem negar)',
          'Os três parecem igualmente difíceis',
        ],
      },
    ],
  },
  feedback: {
    padrao:
      'Obrigada por colocar isso em palavras. Reescrever uma frase autocrítica com mais gentileza não muda o passado, mas treina um jeito diferente — e mais sustentável — de se relacionar consigo mesma.',
    regras: [
      {
        id: 'elemento-gentileza',
        condicoes: [{ campoId: 'elemento_mais_dificil', operador: 'igual', valor: 'Gentileza consigo mesma (em vez de me julgar)' }],
        texto:
          'Faz sentido a gentileza consigo mesma ser a parte mais difícil — para muita gente, a voz autocrítica soa mais "responsável" ou mais familiar do que a voz gentil. Um jeito de começar é perguntar: "o que eu diria para uma amiga aqui?" e tentar dizer isso para si mesma, mesmo que pareça estranho no início.',
      },
      {
        id: 'elemento-humanidade',
        condicoes: [{ campoId: 'elemento_mais_dificil', operador: 'igual', valor: 'Humanidade compartilhada (lembrar que não sou a única)' }],
        texto:
          'É comum sentir que a própria dificuldade é única ou vergonhosa demais para ser comum — mas quase sempre outras pessoas já passaram por versões parecidas do que você está vivendo, mesmo que elas não mostrem isso abertamente.',
      },
      {
        id: 'elemento-atencao-plena',
        condicoes: [{ campoId: 'elemento_mais_dificil', operador: 'igual', valor: 'Atenção plena (observar sem exagerar nem negar)' }],
        texto:
          'Equilibrar entre não negar o que dói e não deixar a dor tomar conta de tudo é realmente um exercício sutil. Uma pergunta que ajuda: "estou descrevendo o que aconteceu, ou já pulei para uma conclusão sobre quem eu sou?"',
      },
      {
        id: 'elemento-todos-dificeis',
        condicoes: [{ campoId: 'elemento_mais_dificil', operador: 'igual', valor: 'Os três parecem igualmente difíceis' }],
        texto:
          'Faz sentido — autocompaixão é uma habilidade, não um traço que se tem ou não se tem, e como toda habilidade leva tempo para ficar mais natural. Praticar mesmo um pedacinho, como fez agora, já é o começo.',
      },
      {
        id: 'reescrita-preenchida',
        condicoes: [{ campoId: 'reescrita_compassiva', operador: 'preenchido' }],
        texto:
          'Reparar na diferença entre o que você diria a si mesma e o que diria a uma amiga já revela bastante — muitas vezes o padrão que aplicamos a nós mesmas é bem mais duro do que o que consideraríamos justo para outra pessoa.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, quando notar uma autocrítica dura, tente pausar e perguntar: "eu diria isso para alguém que eu amo?" Se a resposta for não, tente reformular a frase antes de deixá-la passar sem questionar.',
  resumo: [
    'Autocompaixão não depende de desempenho, diferente da autoestima; e não é o mesmo que se poupar de responsabilidade.',
    'Autocrítica dura tende a piorar ansiedade, desânimo e até a performance — não é um "motivador eficiente".',
    'Os três elementos da autocompaixão são gentileza consigo mesma, humanidade compartilhada e atenção plena.',
    'Ser gentil consigo mesma é uma questão de justiça, não de fingir que está tudo bem.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'A autocompaixão pode ser definida e medida como um constructo composto por três elementos: gentileza consigo mesma, humanidade compartilhada e atenção plena (em oposição a autojulgamento, isolamento e superidentificação).',
      referencia:
        'Neff, K. D. (2003). The Development and Validation of a Scale to Measure Self-Compassion. Self and Identity, 2(3), 223–250.',
      link: 'https://doi.org/10.1080/15298860309027',
      aplicacao:
        'Base direta do modelo de três elementos usado na explicação do módulo e na pergunta do exercício sobre qual elemento parece mais difícil.',
      limitacoes:
        'É um artigo de validação de escala e definição de constructo, com amostra majoritariamente universitária e americana da época; não é um estudo de eficácia de intervenção, então não mede diretamente se praticar autocompaixão muda o bem-estar ao longo do tempo.',
    },
    {
      afirmacao:
        'Níveis mais altos de autocompaixão estão associados a menos sintomas de ansiedade, depressão e sofrimento psicológico em geral.',
      referencia:
        'MacBeth, A., & Gumley, A. (2012). Exploring compassion: A meta-analysis of the association between self-compassion and psychopathology. Clinical Psychology Review, 32(6), 545–552.',
      link: 'https://doi.org/10.1016/j.cpr.2012.06.003',
      aplicacao:
        'Fundamenta a afirmação do módulo de que autocrítica excessiva tende a prejudicar o bem-estar, sustentando a ideia central de trocar autojulgamento por autocompaixão.',
      limitacoes:
        'É uma meta-análise majoritariamente correlacional — a associação entre autocompaixão e menos sintomas não prova que praticar autocompaixão cause, isoladamente, a redução desses sintomas.',
    },
  ],
  camposParaTriagem: ['frase_autocritica', 'reescrita_compassiva'],
};
