import type { ModuloEstruturadoV1 } from '../tipos';

export const modulo9PrevencaoRecaidasPlanoPessoal: ModuloEstruturadoV1 = {
  schemaVersion: 1,
  objetivo:
    'Entender que voltar a se sentir pior depois de um período melhor é parte comum do processo de mudança, não um fracasso, e construir um plano pessoal simples — sinais de alerta, estratégias que já funcionaram, pessoas de confiança e quando buscar ajuda profissional — para ter à mão num momento difícil.',
  duracaoEstimadaMinutos: 10,
  explicacao: [
    'Depois de um período em que as coisas estavam melhores, é comum — e esperado — que em algum momento venha uma fase mais difícil de novo: o humor cai, padrões antigos voltam, aquilo que você vinha enfrentando parece maior outra vez. Isso costuma ser chamado de "recaída", mas o nome pode enganar: não significa que todo o progresso anterior foi apagado ou que ele "não valeu". Mudança emocional raramente é uma linha reta para cima — é mais parecida com uma trilha com subidas, descidas e platôs. Uma fase mais difícil depois de um período melhor é parte esperada desse caminho, não uma exceção vergonhosa nele.',
    'Por isso, faz diferença aprender a notar os sinais iniciais de que as coisas estão ficando mais difíceis, antes que fiquem grandes. Cada pessoa tem os seus próprios sinais, mas alguns exemplos comuns são: mudanças no sono (dormir muito mais ou muito menos do que o costume), começar a se isolar de pessoas ou atividades que antes faziam parte do dia a dia, irritabilidade maior do que o normal, e voltar a evitar coisas que você vinha, aos poucos, conseguindo enfrentar. Perceber esses sinais cedo dá mais espaço de manobra do que perceber só quando a dificuldade já está grande — não para "impedir" a fase difícil de acontecer, mas para reagir a ela com mais cuidado e menos surpresa.',
    'Uma das partes mais úteis de um plano como esse é reunir, num só lugar, o que você já sabe que funciona para você — em vez de ter que reinventar tudo bem no momento em que menos energia e clareza vai ter disponíveis. Isso pode incluir práticas dos módulos anteriores desta jornada (nomear emoções, questionar pensamentos automáticos, autocompaixão, ações pequenas de autocuidado) ou qualquer outra coisa da sua vida que já se mostrou útil antes, mesmo que pareça simples. Ter essa lista pronta de antemão é diferente de tentar se lembrar dela no meio de um momento difícil.',
    'Outra parte essencial é nomear pessoas de confiança específicas — não "alguém" de forma genérica, mas pessoas reais que você poderia procurar. Saber, de antemão, quem são essas pessoas torna muito mais fácil pedir apoio na hora, quando pedir ajuda costuma parecer mais difícil do que em qualquer outro momento. E, junto com isso, vale reconhecer com clareza quando uma fase difícil pede mais do que autocuidado e apoio de pessoas próximas: quando os sinais de alerta persistem por várias semanas, quando começam a afetar seu funcionamento no dia a dia (trabalho, estudos, relações, cuidados básicos), ou quando aparece qualquer pensamento de se machucar, é hora de buscar ajuda profissional — e isso não é um sinal de que você falhou, é o próprio plano funcionando como deveria.',
  ],
  exemplo: {
    titulo: 'Um exemplo do dia a dia',
    texto:
      'Camila passou os últimos meses trabalhando bastante em si mesma: aprendeu a nomear emoções com mais precisão, praticou ser menos dura consigo mesma nos erros, e sentia que estava, aos poucos, melhor. Num mês mais pesado no trabalho, percebeu que voltou a dormir mal, cancelou dois encontros com amigas seguidos "porque não tinha energia", e sentiu uma vontade maior de se isolar no quarto depois do trabalho. No início, pensou "acho que estraguei tudo que eu vinha construindo". Mas, olhando o plano que tinha escrito num momento mais estável, reconheceu ali mesmo os seus sinais de alerta (sono, isolamento) escritos por ela mesma semanas antes. Em vez de se cobrar, seguiu o próprio plano: mandou mensagem para a irmã, com quem tinha combinado que podia ser sincera nesses momentos, e voltou a fazer, mesmo sem muita vontade, um exercício pequeno de nomear emoções que já tinha te ajudado antes. A fase difícil não desapareceu da noite para o dia, mas Camila não precisou atravessá-la do zero, sem nenhum apoio.',
  },
  exercicio: {
    introducao:
      'Este é o seu plano pessoal — um documento simples para guardar e consultar quando as coisas ficarem mais difíceis. Não precisa ser perfeito nem definitivo: você pode revisá-lo sempre que quiser.',
    campos: [
      {
        tipo: 'texto_longo',
        id: 'sinais_de_alerta',
        rotulo: 'Quais costumam ser os seus sinais iniciais de que as coisas estão começando a piorar?',
        placeholder: 'Ex.: durmo pior, começo a cancelar coisas com amigas, fico mais irritada, evito responder mensagens...',
        maxCaracteres: 600,
      },
      {
        tipo: 'texto_longo',
        id: 'estrategias_que_ajudaram',
        rotulo: 'Que ações ou estratégias já te ajudaram no passado (nesta jornada ou na sua vida em geral)?',
        placeholder: 'Ex.: nomear o que estou sentindo, escrever sobre o dia, sair para caminhar, conversar com minha irmã...',
        maxCaracteres: 600,
      },
      {
        tipo: 'texto_longo',
        id: 'pessoas_de_confianca',
        rotulo: 'Quem são pessoas de confiança que você poderia procurar num momento difícil?',
        placeholder: 'Pode escrever só como você se refere a elas, sem precisar de nome completo: "minha irmã", "minha amiga X", "minha prima"...',
        maxCaracteres: 400,
      },
      {
        tipo: 'texto_longo',
        id: 'quando_buscar_ajuda_profissional',
        rotulo: 'Como você vai reconhecer que é hora de buscar ajuda profissional?',
        placeholder: 'Ex.: quando os sinais de alerta persistem por mais de duas semanas, ou quando aparece qualquer pensamento de me machucar',
        maxCaracteres: 500,
      },
    ],
  },
  feedback: {
    padrao:
      'Você acabou de escrever, com suas próprias palavras, um plano que pode ajudar a versão futura de você num momento mais difícil. Guardar isso agora, enquanto está com mais clareza, é um cuidado real com quem você pode ser daqui a algumas semanas ou meses.',
    regras: [
      {
        id: 'sinais-preenchidos',
        condicoes: [{ campoId: 'sinais_de_alerta', operador: 'preenchido' }],
        texto:
          'Conhecer os seus próprios sinais de alerta é uma das partes mais valiosas deste plano — eles são o aviso antecipado que só você consegue reconhecer em si mesma.',
      },
      {
        id: 'estrategias-preenchidas',
        condicoes: [{ campoId: 'estrategias_que_ajudaram', operador: 'preenchido' }],
        texto:
          'Ótimo ter essa lista pronta. Num momento difícil, com menos energia e clareza disponíveis, é muito mais fácil seguir uma lista que você já escreveu do que tentar lembrar ou inventar algo do zero.',
      },
      {
        id: 'pessoas-preenchidas',
        condicoes: [{ campoId: 'pessoas_de_confianca', operador: 'preenchido' }],
        texto:
          'Ter nomes específicos em mente, em vez de "alguém" de forma vaga, costuma tornar bem mais fácil pedir apoio quando é mais difícil pedir. Se conseguir, considere avisar essas pessoas de que elas estão na sua lista.',
      },
      {
        id: 'quando-buscar-ajuda-preenchido',
        condicoes: [{ campoId: 'quando_buscar_ajuda_profissional', operador: 'preenchido' }],
        texto:
          'Reconhecer com antecedência quando vale buscar ajuda profissional não é admitir derrota — é parte de um plano de cuidado bem construído, tanto quanto qualquer uma das outras partes.',
      },
    ],
  },
  acaoPratica:
    'Nas próximas 24 horas, salve este plano em um lugar de fácil acesso (uma nota no celular, um lugar que você volte com frequência) e, se fizer sentido, compartilhe pelo menos uma parte dele com uma das pessoas de confiança que você listou aqui.',
  resumo: [
    'Uma fase mais difícil depois de um período melhor é parte comum do processo, não um fracasso.',
    'Notar os sinais de alerta cedo dá mais espaço para reagir com cuidado, antes que a dificuldade fique grande.',
    'Ter uma lista pronta de estratégias que já funcionaram evita ter que reinventar tudo num momento difícil.',
    'Nomear pessoas de confiança específicas facilita pedir apoio quando isso fica mais difícil.',
    'Saber quando buscar ajuda profissional é parte do plano, não um sinal de que ele falhou.',
  ],
  baseCientifica: [
    {
      afirmacao:
        'Ter um plano estruturado — que inclui identificar sinais de alerta antecipados e estratégias de enfrentamento previamente definidas — ajuda a lidar melhor com um retorno a padrões antigos depois de um período de melhora.',
      referencia: 'Witkiewitz, K., & Marlatt, G. A. (2004). Relapse prevention for alcohol and drug problems: That was Zen, this is Tao. American Psychologist, 59(4), 224–235.',
      link: 'https://doi.org/10.1037/0003-066X.59.4.224',
      aplicacao:
        'Inspira a estrutura geral deste módulo de encerramento: identificar sinais de alerta pessoais, reunir estratégias que já funcionaram, nomear rede de apoio e definir quando buscar ajuda, organizados como um plano escrito para consulta futura.',
      limitacoes:
        'Este modelo foi originalmente desenvolvido e testado no contexto de dependência química e uso de álcool — sua aplicação aqui, para sinais gerais de piora emocional (não relacionados a substâncias), é uma adaptação conceitual do princípio de "plano de prevenção de recaída", não uma extensão diretamente validada por pesquisa para esse uso. O termo "recaída" é usado neste módulo de forma ampla e não-clínica, para descrever qualquer retorno a um padrão emocional mais difícil.',
    },
  ],
  avisoSeguranca:
    'Este plano é um recurso de autocuidado e organização pessoal — ele não substitui uma avaliação profissional, e o app não tem como prever ou identificar uma crise com certeza. Se em algum momento os sinais de alerta persistirem por várias semanas, afetarem seu dia a dia, ou vier qualquer pensamento de se machucar, considere buscar apoio: os recursos de segurança do app (linha de apoio emocional, linha de prevenção do suicídio e contatos de emergência do seu país) estão sempre acessíveis pelo link abaixo.',
  camposParaTriagem: [
    'sinais_de_alerta',
    'estrategias_que_ajudaram',
    'pessoas_de_confianca',
    'quando_buscar_ajuda_profissional',
  ],
};
