import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo5PerfeccionismoMedoFalhar: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender a diferença entre ter padrões altos e cair em perfeccionismo prejudicial, reconhecer o pensamento "tudo ou nada" e o ciclo entre perfeccionismo, procrastinação e autocrítica, e treinar a ideia de "bom o suficiente para o propósito" através de um pequeno experimento prático.',
  duracaoEstimadaMinutos: 9,
  explicacao: [
    'Ter padrões altos e se dedicar de verdade a algo não é, por si só, um problema — muita gente com exigência saudável entrega um trabalho bom, aprende com erros e ainda assim dorme tranquila à noite. A diferença não está em "quanto" você se importa, mas em como você se relaciona com o resultado: dedicação saudável convive com autocompaixão quando algo sai errado, aceita que "bom" às vezes é suficiente e trata um erro como informação, não como sentença. Perfeccionismo prejudicial é outra coisa: os padrões são rígidos (não se ajustam ao contexto), o valor que você atribui a si mesma fica condicionado ao desempenho, e por mais que o resultado seja bom, quase nunca é "bom o bastante".',
    'Um padrão de pensamento muito comum em quem lida com perfeccionismo é o "tudo ou nada": ou o trabalho fica perfeito, ou é um fracasso completo — não existe meio-termo mentalmente registrado como aceitável. Uma prova com nota 9 vira "eu devia ter tirado 10". Um projeto elogiado por oito de dez pessoas vira, na sua cabeça, "duas pessoas não gostaram, então eu fracassei". Esse tipo de pensamento distorce a régua: ele apaga toda a faixa intermediária de "bom", "suficiente" e "válido mesmo com falhas", e deixa só os dois extremos.',
    'Perfeccionismo, procrastinação e autocrítica costumam formar um ciclo que se alimenta sozinho. O medo de não conseguir fazer algo perfeito faz a tarefa parecer ameaçadora demais para começar — então você adia. Adiar aumenta a pressão do prazo e o volume de trabalho acumulado, o que deixa menos espaço para fazer as coisas com calma. Quando finalmente o resultado sai (sob pressão, correndo, ou nem sai), a autocrítica aparece com força: "eu devia ter começado antes", "isso não ficou bom o bastante", "eu sempre faço isso". Essa autocrítica, em vez de motivar, aumenta o medo da próxima tentativa — e o ciclo recomeça no próximo projeto.',
    'Uma forma de sair desse ciclo é trocar a pergunta "isso está perfeito?" por "isso é bom o suficiente para o que essa tarefa precisa fazer?". Um e-mail rápido para confirmar uma reunião não precisa do mesmo cuidado que uma redação de vestibular; um rascunho não precisa ter o acabamento de uma versão final. Definir, antes de começar, qual é o nível de cuidado realmente necessário para aquele propósito específico ajuda a calibrar o esforço — e libera energia para as coisas que de fato merecem mais atenção.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Bianca precisava montar uma apresentação de slides para uma reunião de equipe na sexta-feira. Ela sabia exatamente o que queria dizer desde segunda, mas passou a semana adiando: "vou abrir o arquivo quando tiver mais tempo para fazer direito". Na quinta à noite, com só uma noite de sobra, o pensamento que apareceu foi "não vai dar tempo de ficar bom, é melhor nem entregar do que entregar maltrapilho". Ela ficou até tarde refazendo os mesmos três slides várias vezes, dormiu quatro horas e ainda achou, no dia seguinte, que a apresentação "podia ter sido bem melhor" — mesmo depois de dois colegas elogiarem espontaneamente a clareza dela. Olhando para trás, Bianca percebeu que uma versão simples e direta, feita com calma na segunda-feira, teria cumprido o propósito da reunião tão bem quanto (ou melhor que) a versão de última hora — só que sem a semana inteira de peso e a noite maldormida.',
  },
  exercicio: {
    introducao:
      'Este exercício é um experimento comportamental: em vez de só refletir sobre perfeccionismo, a ideia é testar, na prática, o que acontece quando você faz algo "suficientemente bem" em vez de "perfeito" — e comparar o que sua mente prevê com o que de fato acontece.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'tarefa_experimento',
        rotulo:
          'Escolha uma tarefa pequena e de baixo risco dos próximos dias (algo que, se sair "só bom" em vez de perfeito, não vai gerar consequência grave). Descreva qual é essa tarefa e como você pretende fazê-la "suficientemente bem" de propósito, em vez de perfeita.',
        placeholder: 'Ex.: vou responder aquele e-mail em duas frases diretas, sem reler cinco vezes, e enviar mesmo sem estar "perfeito"...',
        maxCaracteres: 600,
      },
      {
        tipo: 'escala',
        id: 'crenca_algo_ruim',
        rotulo:
          'Agora, antes de fazer o experimento: o quanto você acredita que algo ruim vai acontecer se você fizer essa tarefa "só bem", sem capricho extra?',
        min: 0,
        max: 10,
        rotuloMin: 'Nada — não acho que vai dar problema',
        rotuloMax: 'Muito — tenho certeza que vai dar problema',
      },
      {
        tipo: 'texto_curto',
        id: 'resultado_real',
        rotulo:
          'Depois de fazer o experimento (pode voltar aqui em outro dia para preencher): o que realmente aconteceu?',
        placeholder: 'Ex.: enviei o e-mail direto, ninguém comentou nada, a reunião aconteceu normalmente...',
        maxCaracteres: 400,
        opcional: true,
      },
    ],
  },
  feedback: {
    padrao:
      'Escolher fazer algo "suficientemente bem" de propósito, em vez de perfeito, já é um exercício de coragem — mesmo que a mente ainda insista que precisava ser mais. Preste atenção no que realmente acontece depois: costuma ser bem menos dramático do que a antecipação.',
    regras: [
      {
        id: 'crenca-muito-alta',
        condicoes: [{ campoId: 'crenca_algo_ruim', operador: 'maior_ou_igual', valor: 8 }],
        texto:
          'Uma expectativa tão forte de que algo vai dar errado é exatamente o tipo de previsão que o perfeccionismo costuma fazer — e que raramente se confirma no tamanho esperado. Vale fazer o experimento mesmo assim, com curiosidade genuína: você está prestes a coletar um dado real sobre o que de fato acontece, não só sobre o que a mente imagina.',
      },
      {
        id: 'crenca-moderada',
        condicoes: [
          { campoId: 'crenca_algo_ruim', operador: 'maior_ou_igual', valor: 4 },
          { campoId: 'crenca_algo_ruim', operador: 'menor_ou_igual', valor: 7 },
        ],
        texto:
          'Existe uma dúvida real aí, e isso é normal — é justamente essa incerteza que o experimento ajuda a testar. Depois de fazer a tarefa, compare o resultado real com esse número: costuma haver uma diferença interessante entre o que a gente teme e o que de fato acontece.',
      },
      {
        id: 'crenca-baixa',
        condicoes: [{ campoId: 'crenca_algo_ruim', operador: 'menor_ou_igual', valor: 3 }],
        texto:
          'Que bom que a expectativa de algo dar errado já está baixa — isso pode ser um sinal de que essa tarefa específica é um bom ponto de partida para praticar "bom o suficiente" sem tanta resistência interna. Aproveite para notar como é fazer algo com esse nível de exigência mais leve.',
      },
      {
        id: 'resultado-preenchido',
        condicoes: [{ campoId: 'resultado_real', operador: 'preenchido' }],
        texto:
          'Obrigada por voltar para registrar o que aconteceu de verdade — comparar a previsão com o resultado real é a parte mais valiosa desse tipo de experimento, mesmo quando o resultado foi neutro ou misto.',
      },
      {
        id: 'tarefa-descrita',
        condicoes: [{ campoId: 'tarefa_experimento', operador: 'preenchido' }],
        texto:
          'Ter uma tarefa concreta e um plano específico de "como vou fazer isso só o suficiente" já é metade do trabalho — o resto é permitir que aconteça, mesmo com o desconforto de não capricharmos além do necessário.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, escolha uma tarefa pequena do seu dia (não precisa ser a do exercício) e faça-a de propósito com "80% do capricho de sempre" — e observe se alguém percebe, ou se algo realmente dá errado por causa disso.',
  resumo: [
    'Padrões altos com autocompaixão são diferentes de perfeccionismo rígido com autovalor condicionado ao desempenho.',
    'O pensamento "tudo ou nada" apaga o meio-termo entre "perfeito" e "fracasso total".',
    'Perfeccionismo, procrastinação e autocrítica costumam formar um ciclo que se retroalimenta.',
    'Perguntar "isso é bom o suficiente para o propósito?" ajuda a calibrar o esforço de forma mais realista.',
    'Testar na prática o que acontece quando algo não é perfeito costuma revelar previsões mais assustadoras do que a realidade.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'Perfeccionismo não é um traço único: existem dimensões diferentes (perfeccionismo autoorientado, socialmente prescrito e orientado aos outros), com padrões e impactos distintos sobre como a pessoa se relaciona consigo e com os outros.',
      referencia:
        'Hewitt, P. L., & Flett, G. L. (1991). Perfectionism in the self and social contexts: Conceptualization, assessment, and association with psychopathology. Journal of Personality and Social Psychology, 60(3), 456–470.',
      link: 'https://doi.org/10.1037/0022-3514.60.3.456',
      aplicacao:
        'Fundamenta a distinção entre padrões altos saudáveis e perfeccionismo prejudicial, e a ideia de que "perfeccionismo" não é um único fenômeno igual para todo mundo.',
      limitacoes:
        'É um estudo de conceitualização e medição de décadas atrás; distingue perfeccionismo autoorientado, socialmente prescrito e orientado aos outros — nem todo perfeccionismo tem o mesmo padrão nem o mesmo impacto, e o instrumento original reflete o contexto de pesquisa da época.',
    },
    {
      afirmacao:
        'Perfeccionismo está associado a maior sofrimento psicológico (incluindo ansiedade, depressão e outros indicadores de dificuldade emocional), com força de associação variando conforme o tipo de perfeccionismo medido.',
      referencia:
        'Limburg, K., Watson, H. J., Hagger, M. S., & Egan, S. J. (2017). The Relationship Between Perfectionism and Psychopathology: A Meta-Analysis. Journal of Clinical Psychology, 73(10), 1301–1326.',
      link: 'https://doi.org/10.1002/jclp.22435',
      aplicacao:
        'Fundamenta a explicação sobre o ciclo entre perfeccionismo, autocrítica e sofrimento, e reforça por que vale a pena trabalhar padrões mais flexíveis.',
      limitacoes:
        'É uma associação correlacional entre perfeccionismo e sofrimento psicológico — não prova que um causa o outro isoladamente; os tamanhos de efeito variam bastante conforme o tipo de perfeccionismo e a população estudada.',
    },
  ],
  camposParaTriagem: ['tarefa_experimento', 'resultado_real'],
};
