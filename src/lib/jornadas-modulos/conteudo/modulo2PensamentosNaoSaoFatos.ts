import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo2PensamentosNaoSaoFatos: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender que pensamentos são interpretações automáticas, não fatos, e treinar reconhecer distorções cognitivas comuns e construir um pensamento alternativo mais equilibrado — sem cair em positividade forçada.',
  duracaoEstimadaMinutos: 9,
  explicacao: [
    'Toda hora sua mente produz interpretações automáticas dos eventos — chamamos isso de pensamentos automáticos. Eles surgem tão rápido que costumam parecer verdades óbvias, não hipóteses. Mas um pensamento é só a primeira leitura que a mente faz de uma situação, baseada em experiências passadas, humor do momento e atalhos mentais — não uma descrição objetiva do que está acontecendo. Duas pessoas podem viver exatamente a mesma situação e ter pensamentos automáticos completamente diferentes sobre ela.',
    'O motivo de prestar atenção nisso é que pensamento, emoção e comportamento se retroalimentam: pensar "vou estragar tudo" tende a gerar ansiedade, e a ansiedade tende a puxar comportamentos de evitação ou de controle excessivo, que por sua vez reforçam o pensamento original. Esse ciclo pode rodar horas sem que você perceba que tudo começou numa interpretação automática — não num fato verificado.',
    'Existem padrões comuns de pensamento automático, chamados de distorções cognitivas, que tendem a distorcer a realidade numa direção mais negativa ou mais rígida do que ela é. Algumas das mais frequentes: catastrofização (assumir que o pior cenário vai acontecer — "se eu errar essa entrega, vou ser demitida"); leitura mental (supor o que o outro está pensando sem checar — "ela não respondeu, deve estar puta comigo"); tudo-ou-nada (ver as coisas só em extremos, sem meio-termo — "se não for perfeito, é um fracasso total"); generalização excessiva (transformar um evento isolado numa regra geral — "não consegui dessa vez, eu nunca consigo nada"); e desqualificar o positivo (descartar o que deu certo como se não contasse — "isso só deu certo porque tive sorte, não porque eu sou capaz").',
    'O objetivo de analisar um pensamento não é substituí-lo por um pensamento "positivo" à força. Dizer para si mesma "vai dar tudo certo" quando você não sabe se vai dar certo é só trocar uma distorção por outra — e geralmente não convence ninguém, muito menos você mesma. O objetivo é um pensamento mais equilibrado e realista: um que leve em conta as evidências a favor e as evidências contra, reconheça o que é incerto, e deixe espaço para nuance. Às vezes o pensamento equilibrado ainda é difícil ou desconfortável — e tudo bem, porque ele é mais honesto do que a catástrofe automática e mais sustentável do que o otimismo forçado.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Bianca mandou uma mensagem de bom dia para uma amiga e, três horas depois, ainda não tinha resposta. Pensamento automático: "ela está brava comigo, deve ser por causa daquele comentário que eu fiz semana passada" (leitura mental). Emoção: ansiedade, intensidade 6 de 10. Comportamento: releu a conversa antiga várias vezes procurando o que teria feito de errado. Ao parar para checar evidências, Bianca notou: a favor do pensamento, nada concreto — só a demora em responder; contra o pensamento, a amiga tinha avisado outro dia que a semana estaria corrida no trabalho, e a última conversa das duas tinha terminado bem, com risadas. Pensamento alternativo: "ela pode estar ocupada, ou pode ter algum outro motivo que eu não sei — não tenho evidência real de que está brava, só uma suposição". Isso não apagou a ansiedade na hora, mas tirou o peso de uma certeza que não existia.',
  },
  exercicio: {
    introducao:
      'Pense numa situação recente em que você teve um pensamento automático que gerou desconforto. Vamos separar as partes e olhar as evidências com calma, sem pressa de "pensar positivo".',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'situacao',
        rotulo: 'O que aconteceu? Descreva a situação de forma simples e concreta.',
        placeholder: 'Ex.: mandei uma mensagem e fiquei horas sem resposta...',
        maxCaracteres: 600,
      },
      {
        tipo: 'texto_longo',
        id: 'pensamento_automatico',
        rotulo: 'Qual foi o primeiro pensamento que passou pela sua cabeça nessa situação?',
        placeholder: 'Ex.: "ela está brava comigo"...',
        maxCaracteres: 400,
      },
      {
        tipo: 'escolha_unica',
        id: 'emocao',
        rotulo: 'Qual emoção veio junto com esse pensamento?',
        opcoes: [
          'Ansiedade',
          'Tristeza',
          'Raiva',
          'Vergonha',
          'Culpa',
          'Medo',
          'Frustração',
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
        tipo: 'texto_longo',
        id: 'evidencias_a_favor',
        rotulo: 'Que evidências concretas (fatos, não suposições) apoiam esse pensamento?',
        placeholder: 'Ex.: ela demorou para responder...',
        maxCaracteres: 500,
        opcional: true,
      },
      {
        tipo: 'texto_longo',
        id: 'evidencias_contra',
        rotulo: 'Que evidências concretas contradizem ou enfraquecem esse pensamento?',
        placeholder: 'Ex.: ela tinha avisado que a semana estaria corrida...',
        maxCaracteres: 500,
        opcional: true,
      },
      {
        tipo: 'texto_longo',
        id: 'pensamento_alternativo',
        rotulo:
          'Levando em conta as evidências dos dois lados, como ficaria um pensamento mais equilibrado e realista sobre essa situação? (não precisa ser positivo, só mais honesto com o que você realmente sabe)',
        placeholder: 'Ex.: "não tenho certeza do motivo, pode ser isso ou outra coisa"...',
        maxCaracteres: 500,
      },
    ],
  },
  feedback: {
    padrao:
      'Obrigada por parar e olhar para esse pensamento com mais calma. Separar o pensamento automático das evidências reais é um exercício que fica mais fácil com a prática — nenhuma tentativa é perfeita, e cada uma conta.',
    regras: [
      {
        id: 'intensidade-alta',
        condicoes: [{ campoId: 'intensidade', operador: 'maior_ou_igual', valor: 8 }],
        texto:
          'Faz sentido essa emoção ter vindo forte — quando um pensamento automático parece muito certo, o corpo reage como se já fosse um fato consumado. Vale lembrar: a intensidade da emoção não é prova de que o pensamento é verdadeiro.',
      },
      {
        id: 'emocao-ansiedade',
        condicoes: [{ campoId: 'emocao', operador: 'igual', valor: 'Ansiedade' }],
        texto:
          'Pensamentos automáticos ligados à ansiedade costumam antecipar o pior cenário como se fosse o mais provável. Vale perguntar: esse é o único desfecho possível, ou só o mais assustador entre vários?',
      },
      {
        id: 'emocao-vergonha',
        condicoes: [{ campoId: 'emocao', operador: 'igual', valor: 'Vergonha' }],
        texto:
          'Pensamentos ligados à vergonha costumam vir com generalizações duras sobre quem você é, a partir de um único evento. Um erro ou uma situação difícil descreve o que aconteceu, não a sua identidade inteira.',
      },
      {
        id: 'evidencias-contra-preenchidas',
        condicoes: [{ campoId: 'evidencias_contra', operador: 'preenchido' }],
        texto:
          'Reparar em evidências que contradizem o pensamento automático é justamente o que ajuda a criar distância dele — mesmo quando o desconforto não desaparece por completo.',
      },
      {
        id: 'pensamento-alternativo-preenchido',
        condicoes: [{ campoId: 'pensamento_alternativo', operador: 'preenchido' }],
        texto:
          'Chegar a um pensamento mais equilibrado não significa que ele vai parecer 100% verdadeiro na hora — é normal ainda sentir puxão para a versão antiga. Com repetição, o pensamento mais realista tende a ficar mais acessível.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, quando notar um pensamento automático incomodando você, tente perguntar: "isso é um fato ou uma interpretação?" e "que evidência real eu tenho disso?". Não precisa resolver tudo, só notar a diferença já ajuda.',
  resumo: [
    'Pensamentos são interpretações automáticas, não descrições objetivas da realidade.',
    'Distorções comuns incluem catastrofização, leitura mental, tudo-ou-nada, generalização excessiva e desqualificar o positivo.',
    'O objetivo é um pensamento mais equilibrado e realista, não um pensamento "positivo" forçado.',
    'Olhar evidências a favor e contra ajuda a criar distância do pensamento automático, mesmo sem apagar o desconforto.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'A terapia cognitivo-comportamental, que ensina a identificar e reavaliar pensamentos automáticos e distorções cognitivas, tem eficácia bem documentada para diversos quadros emocionais.',
      referencia:
        'Hofmann, S. G., Asnaani, A., Vonk, I. J. J., Sawyer, A. T., & Fang, A. (2012). The Efficacy of Cognitive Behavioral Therapy: A Review of Meta-analyses. Cognitive Therapy and Research, 36(5), 427–440.',
      link: 'https://doi.org/10.1007/s10608-012-9476-1',
      aplicacao:
        'Fundamenta a abordagem geral do módulo — a ideia de que treinar reavaliação de pensamentos automáticos, como no exercício de evidências a favor e contra, é uma técnica com respaldo empírico.',
      limitacoes:
        'É uma revisão de meta-análises heterogêneas entre diferentes diagnósticos e populações; o tamanho do efeito varia bastante por condição, e os resultados não garantem um efeito individual específico para quem faz este exercício.',
    },
    {
      afirmacao:
        'Pensamentos automáticos negativos podem ser identificados e medidos de forma sistemática, e estão associados a estados emocionais como a ansiedade e a tristeza.',
      referencia:
        'Hollon, S. D., & Kendall, P. C. (1980). Cognitive self-statements in depression: Development of an automatic thoughts questionnaire. Cognitive Therapy and Research, 4(4), 383–395.',
      link: 'https://doi.org/10.1007/bf01178214',
      aplicacao:
        'Base para o conceito central do módulo — o de "pensamento automático" como categoria distinta de fato observável — e para a estrutura do exercício de nomear o pensamento separadamente da situação.',
      limitacoes:
        'É um estudo de desenvolvimento de instrumento, com amostra de estudantes universitários da época e foco original em sintomas depressivos; não cobre necessariamente todas as populações, faixas etárias ou contextos culturais atuais.',
    },
  ],
  camposParaTriagem: ['situacao', 'pensamento_automatico', 'evidencias_a_favor', 'evidencias_contra'],
};
