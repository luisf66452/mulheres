import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo6ImagemCorporal: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender como a comparação social e as redes sociais moldam a relação com o próprio corpo, separar aparência de valor pessoal e de funcionalidade corporal, e reconhecer conteúdos que pioram essa relação — sem qualquer foco em peso, calorias ou dietas.',
  duracaoEstimadaMinutos: 8,
  explicacao: [
    'É quase impossível escapar da comparação: o cérebro compara de forma automática, e redes sociais multiplicam as oportunidades de comparação social a um volume que nenhuma geração anterior enfrentou. O problema não é ver outros corpos — é que boa parte do que aparece no feed é selecionado, editado e postado justamente por mostrar um ângulo, uma luz ou um momento fora do comum, e não é assim que corpos existem no dia a dia, nem o seu, nem o de quem você está vendo. Comparar seu corpo real, em movimento, no espelho de casa, com uma imagem escolhida a dedo entre dezenas de fotos é comparar coisas de naturezas diferentes.',
    'Vale separar três coisas que a cultura costuma embaralhar: aparência (como o corpo parece, de fora), valor pessoal (quem você é, o que você faz, como trata as pessoas, o que te importa) e funcionalidade (o que o corpo faz por você e permite que você viva). Seu valor como pessoa não é uma nota atribuída à sua aparência — e um corpo pode ser fonte de gratidão por tudo que ele possibilita, independentemente de como ele se compara a um padrão estético qualquer.',
    'Na pesquisa em psicologia, existe um conceito chamado "imagem corporal positiva", que vai além de "gostar da aparência" — ele inclui apreciar o corpo pelo que ele faz (funcionalidade), respeitá-lo e cuidar dele, e filtrar de forma crítica as mensagens da cultura sobre como o corpo "deveria" ser. É importante ser clara aqui sobre um ponto: existe também um termo popular, "neutralidade corporal", que fala em focar menos na aparência — nem de forma positiva nem negativa — e mais em outros aspectos da vida e da identidade. Esse termo é parecido, mas não é a mesma coisa que "imagem corporal positiva" estudada academicamente: um foca em apreciar ativamente o corpo (inclusive sua funcionalidade), o outro foca em tirar a aparência do centro da atenção. São conceitos relacionados, mas distintos, e a neutralidade corporal tem, até o momento, bem menos pesquisa científica direta sobre ela do que a imagem corporal positiva.',
    'Reconhecer o que piora sua relação com o corpo é uma habilidade prática. Alguns sinais: sair de um perfil ou de um tipo de conteúdo se sentindo pior do que entrou; perceber que você começa a se comparar automaticamente logo depois de ver certos posts; contas que giram em torno de "antes e depois", corpos idealizados apresentados como padrão único, ou comentários (seus ou de outros) que reduzem pessoas à aparência. Notar esse padrão não é sobre banir redes sociais da sua vida — é sobre perceber o efeito que contas específicas têm em você, e ter mais liberdade de escolha sobre o que consome.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Larissa passava as noites rolando o feed antes de dormir e, várias vezes por semana, fechava o aplicativo se sentindo pior do que quando abriu — sem conseguir dizer exatamente por quê. Um dia ela decidiu prestar atenção: percebeu que era sempre depois de ver um tipo específico de conta, de pessoas com corpos parecidos entre si, em fotos muito trabalhadas, com legendas que insinuavam que aquele era "o padrão" a seguir. No dia seguinte, Larissa parou para pensar no que o próprio corpo fazia por ela naquela semana: as pernas que a levaram para dançar com as amigas no sábado, os braços que carregaram a sobrinha pequena no colo, as mãos que fizeram o bolo de aniversário da mãe. Nada daquilo tinha a ver com como o corpo dela se comparava a uma foto na internet. Ela silenciou aquelas contas específicas — não por raiva delas, mas porque percebeu, com clareza, o efeito que tinham nela.',
  },
  exercicio: {
    introducao:
      'Vamos praticar duas coisas: notar o que seu corpo faz por você além da aparência, e observar com mais atenção o efeito que certos conteúdos das redes sociais têm em como você se sente.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'funcoes_corpo',
        rotulo:
          'Pense em 2 ou 3 coisas que seu corpo fez por você recentemente e que não têm nada a ver com aparência (ex.: te levou a algum lugar importante, permitiu abraçar alguém, fez algo que você gosta). Escreva esses exemplos.',
        placeholder: 'Ex.: minhas pernas me levaram até a casa da minha avó, minhas mãos escreveram uma carta para uma amiga...',
        maxCaracteres: 600,
      },
      {
        tipo: 'texto_longo',
        id: 'conteudo_que_piora',
        rotulo:
          'Existe alguma conta ou tipo de conteúdo nas redes sociais que costuma piorar como você se sente com o próprio corpo depois de ver? Se sim, o que é, e o que você poderia fazer a respeito (deixar de seguir, silenciar, limitar o tempo, ou outra coisa)?',
        placeholder: 'Ex.: perfis de "antes e depois" me deixam mal, acho que vou silenciar por um tempo...',
        maxCaracteres: 600,
        opcional: true,
      },
    ],
  },
  feedback: {
    padrao:
      'Obrigada por parar para notar isso com mais atenção — separar aparência de funcionalidade e de valor pessoal é um exercício que vale a pena repetir sempre que a comparação automática aparecer.',
    regras: [
      {
        id: 'funcoes-preenchidas',
        condicoes: [{ campoId: 'funcoes_corpo', operador: 'preenchido' }],
        texto:
          'Reparar no que o corpo faz por você, e não só em como ele parece, é um exercício simples que pode ser repetido a qualquer momento — inclusive em dias em que a relação com a aparência estiver mais difícil.',
      },
      {
        id: 'conteudo-identificado',
        condicoes: [{ campoId: 'conteudo_que_piora', operador: 'preenchido' }],
        texto:
          'Identificar exatamente qual conteúdo piora como você se sente já é metade do caminho — você não precisa agir sobre isso hoje, mas agora tem mais clareza para escolher o que fazer da próxima vez que aquele conteúdo aparecer.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, escolha uma conta ou tipo de conteúdo que você notou que piora como se sente com o próprio corpo, e silencie, deixe de seguir ou limite o tempo com ela — sem precisar justificar essa escolha para ninguém.',
  resumo: [
    'Comparação social é automática, mas o que vemos nas redes é selecionado e editado — comparar não é justo.',
    'Aparência, valor pessoal e funcionalidade do corpo são coisas diferentes, mesmo que a cultura as misture.',
    '"Imagem corporal positiva" (conceito estudado cientificamente) e "neutralidade corporal" (termo popular) são parecidos, mas não são sinônimos.',
    'Notar o efeito real de contas e conteúdos específicos ajuda a escolher com mais liberdade o que consumir.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'Imagem corporal positiva é um constructo próprio (não apenas a ausência de imagem corporal negativa) que inclui apreciação do corpo, valorização de sua funcionalidade e filtragem crítica de mensagens culturais sobre aparência.',
      referencia:
        'Tylka, T. L., & Wood-Barcalow, N. L. (2015). What is and what is not positive body image? Conceptual foundations and construct definition. Body Image, 14, 118–129.',
      link: 'https://doi.org/10.1016/j.bodyim.2015.04.001',
      aplicacao:
        'Fundamenta a explicação sobre apreciação corporal e funcionalidade do corpo, e embasa a distinção explícita feita no texto entre "imagem corporal positiva" (constructo acadêmico) e "neutralidade corporal" (termo popular).',
      limitacoes:
        'Este estudo trata do constructo acadêmico "imagem corporal positiva" e apreciação/funcionalidade corporal — não é um estudo sobre "neutralidade corporal" como termo popular, que é um conceito relacionado mas distinto, com menos pesquisa empírica direta até o momento.',
    },
    {
      afirmacao:
        'O uso de redes sociais, especialmente exposição a imagens idealizadas e comparação social de aparência, está associado a maior preocupação com a imagem corporal.',
      referencia:
        'Fardouly, J., & Vartanian, L. R. (2016). Social Media and Body Image Concerns: Current Research and Future Directions. Current Opinion in Psychology, 9, 1–5.',
      link: 'https://doi.org/10.1016/j.copsyc.2015.09.005',
      aplicacao:
        'Fundamenta a explicação sobre comparação social nas redes e a parte do exercício que convida a identificar contas ou conteúdos que pioram a relação com o corpo.',
      limitacoes:
        'Artigo de revisão majoritariamente sobre mulheres jovens ocidentais usando redes sociais como Facebook e Instagram; efeitos variam por indivíduo e tipo de uso da rede social, e a associação encontrada não é determinística nem se aplica da mesma forma a todo mundo.',
    },
  ],
  camposParaTriagem: ['funcoes_corpo', 'conteudo_que_piora'],
};
