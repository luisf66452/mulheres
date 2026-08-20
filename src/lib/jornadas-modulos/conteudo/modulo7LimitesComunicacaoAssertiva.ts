import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo7LimitesComunicacaoAssertiva: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Diferenciar comunicação passiva, agressiva e assertiva, reconhecer sinais de que um limite pessoal foi ultrapassado, praticar pedidos claros e o direito de dizer "não" sem excesso de justificativa, e normalizar a culpa que costuma aparecer depois de estabelecer um limite saudável.',
  duracaoEstimadaMinutos: 9,
  explicacao: [
    'Existem, de forma simplificada, três estilos de comunicação diante de um conflito ou pedido. Na comunicação passiva, você não expressa sua própria necessidade — engole o incômodo, concorda mesmo sem querer, ou espera que a outra pessoa "adivinhe" o que você sente (ex.: uma amiga pede para você trocar de horário pela terceira vez no mês e você diz "tudo bem, sem problema", mesmo estando cansada disso). Na comunicação agressiva, sua necessidade é expressa, mas a da outra pessoa é desrespeitada — no tom, nas palavras ou na forma (ex.: "você sempre faz isso, é um saco combinar qualquer coisa com você"). Na comunicação assertiva, você expressa o que sente e precisa, respeitando também o espaço da outra pessoa (ex.: "percebi que essa é a terceira vez que muda o horário este mês, e isso tem mexido comigo — dá para combinarmos algo que funcione para as duas?"). Nenhum estilo é um "defeito de personalidade": são padrões aprendidos, que podem ser treinados e ajustados.',
    'Reconhecer os próprios limites nem sempre é óbvio, porque muita gente aprende a ignorar os primeiros sinais. Alguns indícios de que um limite foi ultrapassado: irritação que se repete sempre que uma mesma pessoa ou situação aparece; cansaço desproporcional depois de um contato específico; ressentimento acumulado (aquela sensação de "eu não devia ter aceitado isso" que fica remoendo por dias). Esses sinais não significam que você está sendo "difícil" — eles são informação. Quanto antes você perceber esse padrão, mais cedo consegue agir antes que o ressentimento vire uma explosão ou um afastamento silencioso.',
    'Fazer um pedido claro envolve ser específica sobre o quê, e evitar generalizações ("você nunca me ajuda" vira "eu gostaria que você lavasse a louça nos dias em que eu cozinho"). E dizer "não" não exige um parágrafo de justificativa: um "não posso essa semana" ou "isso não funciona para mim agora" já é uma resposta completa. Explicar demais um "não" — numa tentativa de parecer razoável o suficiente para não ser questionada — costuma abrir espaço para que a outra pessoa tente contra-argumentar cada motivo, um por um, até você ceder.',
    'É bastante comum sentir culpa logo depois de estabelecer um limite, mesmo quando esse limite é necessário e saudável — principalmente se você aprendeu, ao longo da vida, que agradar os outros é mais seguro do que priorizar a própria necessidade. Essa culpa não é, necessariamente, um sinal de que você fez algo errado: muitas vezes é só o desconforto de fazer algo diferente do padrão automático. Reconhecer "sinto culpa, e mesmo assim esse limite fazia sentido" é diferente de deixar a culpa decidir por você.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Fernanda emprestava dinheiro para o mesmo colega de trabalho havia meses, sempre "só até o fim do mês", e o pagamento nunca vinha no combinado. Da primeira vez ela só disse "tudo bem, sem pressa" (passivo), engolindo a irritação. Na quarta vez, quase explodiu: "isso é falta de consideração, você não liga para o que combina" (agressivo) — e se sentiu mal depois, porque não era bem isso que queria dizer. Na quinta vez que ele pediu, Fernanda parou antes de responder e organizou o que queria dizer: "Quando combinamos um prazo e ele não é cumprido sem aviso, eu fico numa posição difícil, porque também tenho contas para pagar. Dessa vez eu não vou poder emprestar." Sentiu um aperto no estômago e uma pontada de culpa logo depois de mandar a mensagem — mas o limite fazia sentido, e ela decidiu não apagar o que tinha escrito.',
  },
  exercicio: {
    introducao:
      'Pense em uma situação real e recente em que você sentiu que um limite seu foi ultrapassado, ou em que você gostaria de fazer um pedido mais claro para alguém. Vamos usar uma estrutura simples, inspirada em comunicação assertiva, para organizar isso em palavras.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'situacao',
        rotulo: 'Situação: o que aconteceu, da forma mais objetiva possível (sem julgamento sobre a outra pessoa).',
        placeholder: 'Ex.: minha amiga cancelou nosso encontro em cima da hora pela terceira vez este mês...',
        maxCaracteres: 600,
      },
      {
        tipo: 'texto_longo',
        id: 'sentimento',
        rotulo: 'Sentimento: o que você sente em relação a essa situação?',
        placeholder: 'Ex.: eu me sinto frustrada e um pouco desvalorizada...',
        maxCaracteres: 400,
      },
      {
        tipo: 'texto_longo',
        id: 'necessidade',
        rotulo: 'Necessidade: o que está por trás desse sentimento? Do que você precisa nessa relação ou situação?',
        placeholder: 'Ex.: eu preciso sentir que meu tempo também é considerado...',
        maxCaracteres: 400,
      },
      {
        tipo: 'texto_longo',
        id: 'pedido',
        rotulo: 'Pedido claro: o que você gostaria de pedir, de forma específica e realizável (evite generalizações como "sempre" ou "nunca")?',
        placeholder: 'Ex.: gostaria que, se precisar cancelar, me avisasse com um dia de antecedência...',
        maxCaracteres: 400,
      },
      {
        tipo: 'texto_curto',
        id: 'limite_especifico',
        rotulo: 'Se houver, qual é o limite específico que você quer estabelecer nessa relação a partir de agora?',
        placeholder: 'Ex.: não vou mais remarcar meus próprios planos por causa de cancelamentos de última hora...',
        maxCaracteres: 300,
        opcional: true,
      },
    ],
  },
  feedback: {
    padrao:
      'Colocar situação, sentimento, necessidade e pedido em palavras separadas já é um exercício de assertividade em si — mesmo que você nunca chegue a dizer isso em voz alta para a outra pessoa. Isso te dá clareza para escolher, com calma, o que fazer a seguir.',
    regras: [
      {
        id: 'pedido-preenchido',
        condicoes: [{ campoId: 'pedido', operador: 'preenchido' }],
        texto:
          'Transformar um incômodo em um pedido específico é uma das partes mais difíceis da comunicação assertiva — reparar se o seu pedido está claro e realizável (algo que a outra pessoa realmente pode fazer) ajuda a aumentar as chances de ser bem recebido.',
      },
      {
        id: 'necessidade-preenchida',
        condicoes: [{ campoId: 'necessidade', operador: 'preenchido' }],
        texto:
          'Identificar a necessidade por trás do sentimento é o que dá direção ao pedido — sem isso, é fácil ficar só na queixa, sem saber exatamente o que pedir para que a situação melhore.',
      },
      {
        id: 'limite-especifico-preenchido',
        condicoes: [{ campoId: 'limite_especifico', operador: 'preenchido' }],
        texto:
          'Ter um limite específico nomeado ajuda a reconhecê-lo mais rápido da próxima vez que a situação se repetir — e lembre-se de que sentir culpa ao sustentar esse limite não significa que ele esteja errado.',
      },
      {
        id: 'situacao-preenchida',
        condicoes: [{ campoId: 'situacao', operador: 'preenchido' }],
        texto:
          'Descrever a situação de forma objetiva, sem embutir julgamento sobre a outra pessoa, costuma facilitar a conversa — é mais fácil alguém ouvir "isso aconteceu três vezes" do que "você é irresponsável".',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, escolha uma situação pequena em que normalmente você diria "sim" por hábito, e pratique um "não" simples e sem justificativa longa — só "isso não vai dar para mim agora", e observe como se sente.',
  resumo: [
    'Comunicação passiva ignora sua necessidade, agressiva ignora a do outro, assertiva respeita as duas.',
    'Irritação repetida, cansaço e ressentimento são sinais de que um limite foi ultrapassado.',
    'Um pedido claro é específico; um "não" não precisa de parágrafos de justificativa.',
    'Sentir culpa depois de estabelecer um limite é comum e não significa que o limite estava errado.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'O treino de assertividade é uma intervenção com base em evidências para ajudar pessoas a expressar necessidades e limites de forma mais eficaz nas relações, reduzindo padrões de comunicação passiva ou agressiva.',
      referencia:
        'Speed, B. C., Goldstein, B. L., & Goldfried, M. R. (2018). Assertiveness training: A forgotten evidence-based treatment. Clinical Psychology: Science and Practice, 25(1), e12216.',
      link: 'https://doi.org/10.1111/cpsp.12216',
      aplicacao:
        'Fundamenta a estrutura de comunicação assertiva ensinada no módulo (diferenciação entre estilos passivo, agressivo e assertivo) e o exercício de pedido claro baseado em situação, sentimento, necessidade e pedido.',
      limitacoes:
        'Os próprios autores argumentam que o treino de assertividade é historicamente subestudado nas últimas décadas comparado a outras intervenções de TCC; a base de evidência é mais restrita e antiga do que a de intervenções mais estudadas atualmente.',
    },
  ],
  avisoSeguranca:
    'Atenção: as técnicas deste módulo servem para diferenças de comunicação do dia a dia — combinar horários, dividir tarefas, pedir consideração em uma relação que, no fundo, é segura. Se a situação que você descreveu envolve abuso, coerção, controle (por exemplo, alguém que não te deixa sair, decide por você, ameaça, humilha ou machuca fisicamente) ou qualquer forma de violência, de um parceiro, familiar ou qualquer outra pessoa, isso NÃO é um problema de comunicação, e as técnicas de pedido assertivo deste módulo não se aplicam e não devem ser usadas para tentar "negociar" a sua própria segurança. Você não precisa formular o pedido perfeito para merecer estar segura. Nesses casos, o caminho é buscar apoio especializado: o CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito e sigiloso 24 horas por dia, pelo telefone 188 ou pelo chat em cvv.org.br — não é um serviço de emergência, mas está disponível para conversar a qualquer hora. Se houver risco imediato à sua integridade física, procure o SAMU (192), uma UPA, um pronto-socorro ou o hospital mais próximo.',
  camposParaTriagem: ['situacao', 'sentimento', 'necessidade', 'pedido'],
};
