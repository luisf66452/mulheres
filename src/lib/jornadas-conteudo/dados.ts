// Conteúdo real das 4 jornadas (26 módulos, 83 sessões). Vive em código, não
// no banco — mesmo padrão dos outros conteúdos estáticos do app. Só o
// PROGRESSO de cada usuária é persistido; os componentes calculam o estado de
// cada sessão (disponível/em_andamento/concluída/bloqueada) a partir desse
// progresso, nunca lendo daqui — este arquivo não tem, de propósito, nenhum
// campo de progresso.
//
// Todo texto é original, escrito para o Rose — não é cópia dos artigos
// científicos referenciados (ver `./referencias.ts`). Nenhuma sessão promete
// cura, emagrecimento ou resultado garantido. A jornada de alimentação
// emocional não menciona contagem de calorias, peso, IMC, dieta ou divisão de
// alimentos entre "bons" e "ruins"; comportamentos de risco (restrição severa,
// vômito, laxantes, compensação) só aparecem dentro de avisos que apontam para
// avaliação profissional.
//
// revisaoStatus é 'pendente' em TODAS as sessões: nada aqui passou por revisão
// humana da psicóloga responsável. Não preencher revisadoPor/revisadoEm sem
// essa revisão de verdade acontecer.

import type { Jornada, Modulo, Sessao } from './tipos';

function modulo(id: string, titulo: string, sessoes: Sessao[]): Modulo {
  return { id, titulo, sessoes };
}

function sessao(dados: Omit<Sessao, 'revisaoStatus'>): Sessao {
  return { ...dados, revisaoStatus: 'pendente' };
}

// Avisos reutilizados na jornada de alimentação emocional. Sempre apontam para
// avaliação profissional e, para adolescentes, para uma pessoa adulta de
// confiança.
const AVISO_ALIMENTACAO =
  'O Rose é conteúdo educativo e não faz diagnóstico nem tratamento. Se episódios com sensação de perda de controle, regras alimentares muito rígidas ou qualquer tentativa de compensar o que comeu (vomitar, usar laxantes, ficar longos períodos sem comer de propósito, exercício como punição) fazem parte da sua experiência, procure um profissional de saúde com experiência em alimentação. Se você tem menos de 18 anos, conte também para uma pessoa adulta de confiança. Se sentir tontura, desmaio ou qualquer sinal físico preocupante, procure atendimento médico.';

// ============================================================
// JORNADA 1 — IMAGEM CORPORAL (6 módulos, 24 sessões)
// ============================================================

const IC_M1 = modulo('imagem-corporal-m1', 'Relação com o próprio corpo', [
  sessao({
    id: 'imagem-corporal-m1-s1',
    titulo: 'Imagem corporal não é o seu corpo',
    descricaoCurta: 'Entenda a diferença entre o corpo real e a imagem que você carrega dele.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Imagem corporal é o jeito como você pensa, sente e age em relação ao próprio corpo — não é uma medida objetiva do corpo em si. Duas pessoas com corpos parecidos podem carregar imagens corporais bem diferentes, porque essa imagem é feita de pensamentos, memórias, comparações e emoções. Perceber essa diferença muda o foco desta jornada: aqui não se trata de mudar seu corpo, e sim de entender melhor a relação que você tem com ele.',
    praticaGuiada: [
      'Lembre de uma situação recente em que você reparou no seu corpo — ao se vestir, ao passar por um reflexo, ao ver uma foto.',
      'Sem tentar corrigir nada, anote três coisas separadas: o que aconteceu, o que você pensou e o que sentiu.',
      'Releia o que escreveu como quem observa, não como quem julga: você está descrevendo um momento, não avaliando se ele foi certo.',
    ],
    reflexao: 'O que mudou ao separar "o que aconteceu" de "o que eu senti"?',
    leveComVoce:
      'Dá para observar um pensamento sobre o corpo sem precisar consertá-lo na hora. Só perceber já é um começo.',
    fontesCientificas: ['IC1'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s2',
    titulo: 'O que o meu corpo torna possível',
    descricaoCurta: 'Volte a atenção para aquilo que seu corpo permite que você faça e viva.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Boa parte do sofrimento com a imagem corporal nasce de olhar só para a aparência. Existe outro caminho possível: notar a funcionalidade, ou seja, aquilo que o corpo permite fazer, sentir e viver. Em estudos com mulheres insatisfeitas com o próprio corpo, exercícios curtos de escrita sobre funcionalidade estiveram associados a mais satisfação corporal, com efeitos de tamanho pequeno a moderado — não é uma virada garantida, é uma direção que pode ajudar algumas pessoas.',
    praticaGuiada: [
      'Pense nas últimas 24 horas e liste ações do seu corpo: andar, respirar fundo, abraçar alguém, sentir o gosto de uma comida, descansar.',
      'Escolha três dessas ações e escreva uma frase curta sobre cada uma — o que ela permitiu que você vivesse.',
      'Não é preciso sentir gratidão para fazer este exercício. Só observar já conta.',
    ],
    reflexao: 'Existe alguma função do seu corpo que você nunca tinha parado para notar?',
    leveComVoce: 'Seu corpo faz muito mais do que aparece em um reflexo — e isso também é real.',
    fontesCientificas: ['IC1', 'IC2'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s3',
    titulo: 'Perceber sem avaliar',
    descricaoCurta: 'Pratique notar sensações do corpo sem rotular como bom ou ruim.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Boa parte do desconforto com o corpo vem de avaliar o tempo todo: bonito, feio, certo, errado. Existe uma forma diferente de prestar atenção, que é descrever sem julgar. Esse tipo de percepção neutra é uma habilidade — como toda habilidade, fica mais fácil com repetição, e não precisa sair bem já na primeira vez.',
    praticaGuiada: [
      'Sente-se de um jeito confortável. Você pode fechar os olhos, se quiser, ou manter o olhar baixo.',
      'Perceba o contato do corpo com a cadeira ou o chão e descreva mentalmente as sensações: firme, macio, quente, frio.',
      'Perceba a temperatura da pele e o ritmo da respiração, sem tentar mudar nada — só descrevendo o que está aí.',
      'Se surgir um julgamento, note que é um pensamento passando e volte para a descrição neutra.',
    ],
    leveComVoce: 'Descrever é diferente de avaliar — e essa diferença pode aliviar bastante.',
    fontesCientificas: ['IC1'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s4',
    titulo: 'Um cuidado que não depende da aparência',
    descricaoCurta: 'Escolha uma ação de cuidado que valeria a pena mesmo sem resultado estético.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Muito do que chamamos de cuidado com o corpo hoje é medido pelo resultado que promete na aparência. Esta sessão propõe o contrário: escolher uma ação de cuidado — conforto, proteção, descanso ou saúde — que continuaria fazendo sentido mesmo que não mudasse nada visível. É um jeito prático de exercitar a atenção à funcionalidade em vez da avaliação estética.',
    praticaGuiada: [
      'Pense em quatro áreas: conforto, proteção, descanso e saúde.',
      'Escolha uma ação simples em uma delas — usar uma roupa confortável, proteger a pele do sol, dormir um pouco mais cedo, beber água ao longo do dia.',
      'Anote quando e como você pretende fazer isso ainda esta semana.',
      'Ao realizar a ação, note que ela vale por si só, não pelo que corrige na aparência.',
    ],
    reflexao: 'Como foi escolher um cuidado sem pensar em como ele vai te fazer parecer?',
    leveComVoce: 'Cuidar do corpo não precisa ter como objetivo mudar como ele parece.',
    fontesCientificas: ['IC1', 'IC2'],
  }),
]);

const IC_M2 = modulo('imagem-corporal-m2', 'Comparação da aparência', [
  sessao({
    id: 'imagem-corporal-m2-s1',
    titulo: 'Quando a comparação de aparência aparece',
    descricaoCurta: 'Mapeie os momentos em que você mais compara sua aparência com a de outras pessoas.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comparar a própria aparência com a de outras pessoas costuma ser automático: acontece antes mesmo de você decidir. Não é sinal de fraqueza nem de vaidade, é um hábito mental muito comum. Em estudos experimentais, foi justamente a comparação feita no momento — e não simplesmente o tempo de exposição — que apareceu ligada à piora de humor depois de ver imagens de corpos idealizados. Por isso o primeiro passo aqui é só mapear onde e quando ela aparece.',
    praticaGuiada: [
      'Pense nos últimos dias e identifique um ou dois momentos em que se comparou com a aparência de alguém.',
      'Para cada um, anote onde você estava, com quem (ou com o quê — pode ser uma foto ou um vídeo) e o que disparou a comparação.',
      'Não julgue os momentos que encontrar. Você está desenhando um mapa, não fazendo uma avaliação.',
    ],
    reflexao: 'Existe algum padrão nos lugares ou horários em que a comparação aparece mais?',
    leveComVoce: 'Mapear é diferente de combater. Você só está começando a enxergar o padrão.',
    fontesCientificas: ['IC4', 'IC3'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s2',
    titulo: 'De quem é essa régua?',
    descricaoCurta: 'Identifique de onde vieram os padrões que você usa para se comparar.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Quando comparamos aparência, usamos uma régua — um padrão de referência. Essa régua não nasceu com você: veio de família, cultura, publicidade e redes sociais. Programas que ensinam a olhar criticamente para as mensagens da mídia estiveram associados, em média, a melhora na imagem corporal de adolescentes, ainda que com resultados bem variados entre os estudos. Reconhecer a origem da régua é o começo desse olhar crítico.',
    praticaGuiada: [
      'Pense num padrão de aparência que você costuma usar como referência: um tipo de corpo, uma característica específica.',
      'Tente rastrear de onde ele veio — uma frase ouvida na infância, uma revista, um perfil que você segue, um comentário de família.',
      'Escreva uma frase reconhecendo essa origem, por exemplo: "Esse padrão veio de tal lugar, não é uma regra que eu escolhi."',
    ],
    leveComVoce: 'Uma régua que veio de fora não precisa continuar medindo a sua vida.',
    fontesCientificas: ['IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s3',
    titulo: 'Da hierarquia para a diversidade',
    descricaoCurta: 'Pratique observar diferenças entre corpos sem colocá-los em ordem.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Comparar costuma vir junto de hierarquizar: colocar corpos numa escala do melhor para o pior. Existe um movimento diferente possível, que é observar diferenças como diferenças. Há evidência inicial de que conteúdo que trata corpos de forma neutra, sem julgar peso, está associado a menos autoavaliação pela aparência do que conteúdo que estigmatiza — é um resultado recente e ainda pouco replicado, mas suficiente para valer o experimento.',
    praticaGuiada: [
      'Pense em duas ou três pessoas com corpos visivelmente diferentes entre si — reais ou de uma lembrança geral.',
      'Para cada uma, descreva uma característica do corpo sem usar palavras de valor como melhor, pior ou mais bonito. Só descrição.',
      'Note como é diferente descrever sem ranquear. Pode parecer estranho no começo, e isso é esperado.',
    ],
    leveComVoce: 'Diferença não é hierarquia. São só formas diferentes de existir.',
    fontesCientificas: ['IC9', 'IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s4',
    titulo: 'Um próximo passo quando a comparação surgir',
    descricaoCurta: 'Monte uma sequência pessoal para o momento em que a comparação voltar.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de mapear quando a comparação aparece e de onde vem a régua, o próximo passo é ter um plano simples para quando ela surgir de novo. O objetivo não é eliminar a comparação — isso não é realista nem é a proposta — e sim não ficar presa nela por muito tempo.',
    praticaGuiada: [
      'Defina uma sequência curta de quatro passos: notar, nomear ("isso é uma comparação"), tirar a atenção do estímulo e respirar no seu ritmo.',
      'Escolha uma ação alinhada ao que importa para você para fazer logo em seguida — voltar ao que estava fazendo, escrever uma frase, sair para tomar um ar.',
      'Guarde essa sequência em algum lugar fácil de consultar, para lembrar dela na próxima vez.',
    ],
    leveComVoce: 'Você não precisa parar de comparar da noite para o dia — ter um próximo passo já ajuda.',
    fontesCientificas: ['IC4', 'IC7'],
  }),
]);

const IC_M3 = modulo('imagem-corporal-m3', 'Idealização do corpo perfeito', [
  sessao({
    id: 'imagem-corporal-m3-s1',
    titulo: 'O corpo ideal muda o tempo todo',
    descricaoCurta: 'Veja como o "corpo perfeito" já foi diferente em outras épocas e culturas.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'O que é chamado de corpo ideal já mudou várias vezes ao longo da história e varia entre culturas ainda hoje. Isso indica que esse ideal não é uma verdade fixa sobre beleza: é uma construção que acompanha época, lugar e interesses comerciais. Questionar ativamente esse ideal é justamente o que os programas de leitura crítica de mídia treinam.',
    praticaGuiada: [
      'Pense (ou pesquise rapidamente, se quiser) em como o corpo ideal era retratado décadas atrás, ou em outra cultura que você conheça.',
      'Compare mentalmente com o ideal mais comum hoje nas redes que você usa.',
      'Escreva uma frase sobre o que essa mudança revela: um ideal que muda tanto dificilmente é uma verdade absoluta.',
    ],
    leveComVoce: 'Se o ideal muda o tempo todo, ele nunca foi sobre você — é sobre a época.',
    fontesCientificas: ['IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s2',
    titulo: 'Uma imagem é um recorte escolhido',
    descricaoCurta: 'Entenda o que fica de fora de uma foto: pose, luz, edição, contexto.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Toda imagem que chega até você passou por escolhas: ângulo, pose, iluminação, edição, seleção entre dezenas de tentativas. Isso não diz nada sobre a pessoa retratada — diz sobre o processo. A imagem é um recorte curado e editado de um instante, não um registro neutro da vida de alguém. Em estudos de laboratório, ver imagens de corpos idealizados esteve associado a mais insatisfação corporal logo depois, independentemente da quantidade de curtidas.',
    praticaGuiada: [
      'Pense numa imagem que costuma te fazer sentir mal em comparação.',
      'Liste os fatores que podem ter moldado aquele resultado: ângulo, luz, pose ensaiada, filtro, edição, escolha entre muitas fotos tiradas.',
      'Perceba quantos desses fatores acontecem fora do quadro — você só vê o resultado final.',
    ],
    reflexao: 'Como fica diferente olhar para essa imagem sabendo de tudo isso?',
    leveComVoce: 'Uma imagem é um recorte escolhido e editado, não um retrato completo de uma vida.',
    fontesCientificas: ['IC3', 'IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s3',
    titulo: 'O custo de perseguir o impossível',
    descricaoCurta: 'Coloque lado a lado o que o corpo ideal promete e o que ele cobra.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Perseguir um ideal de corpo tem um custo concreto: tempo, energia, dinheiro, atenção e, às vezes, relações. Colocar lado a lado o que esse ideal promete e o que ele cobra ajuda a enxergar essa troca com clareza, sem depender só de força de vontade para "não ligar".',
    praticaGuiada: [
      'Divida uma folha ou um campo de texto em duas colunas: "o que esse ideal promete" e "o que ele cobra de mim".',
      'Na primeira coluna, anote o que você imagina que ganharia ao alcançar o ideal: aceitação, confiança, admiração.',
      'Na segunda, anote o que já gastou ou gasta perseguindo isso: tempo, energia, dinheiro, momentos de vida.',
      'Olhe as duas colunas juntas, sem pressa e sem precisar concluir nada agora.',
    ],
    reflexao: 'O que a comparação entre as duas colunas revela para você?',
    leveComVoce: 'Ver o custo com clareza não é desistir de se cuidar — é decidir com mais consciência.',
    fontesCientificas: ['IC5', 'IC3'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s4',
    titulo: 'Padrões mais flexíveis para os dias difíceis',
    descricaoCurta: 'Escreva como você quer tratar seu corpo inclusive quando o dia estiver ruim.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Depois de questionar de onde vem o ideal de corpo perfeito e o que ele custa, esta sessão propõe trocar essa régua rígida por algo mais seu: uma declaração pessoal, baseada em valores, sobre como você quer se tratar — inclusive, e principalmente, nos dias difíceis.',
    praticaGuiada: [
      'Complete a frase: "Mesmo em dias difíceis, quero tratar meu corpo com..." — escolhendo palavras ligadas a valores, não a aparência (respeito, paciência, cuidado).',
      'Escreva duas ou três frases curtas descrevendo como isso apareceria na prática no seu dia a dia.',
      'Guarde essas frases em algum lugar acessível para reler quando precisar.',
    ],
    leveComVoce: 'Um padrão flexível, escolhido por você, aguenta os dias difíceis melhor do que um ideal rígido.',
    fontesCientificas: ['IC7', 'IC1'],
  }),
]);

const IC_M4 = modulo('imagem-corporal-m4', 'Autocrítica e aceitação corporal', [
  sessao({
    id: 'imagem-corporal-m4-s1',
    titulo: 'Conhecendo a voz crítica sobre o corpo',
    descricaoCurta: 'Registre as palavras exatas que sua autocrítica costuma usar.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'A autocrítica sobre o corpo costuma repetir frases muito parecidas, quase um roteiro fixo. Reconhecer as palavras exatas e os gatilhos que a ativam abre uma porta diferente de "tentar não pensar assim" — que raramente funciona. Aqui o objetivo é apenas identificar, não responder ainda.',
    praticaGuiada: [
      'Lembre de uma frase recente que sua autocrítica disse sobre seu corpo e escreva as palavras exatas, não um resumo.',
      'Anote o que estava acontecendo quando essa frase apareceu: uma roupa, um comentário, uma imagem, um cansaço.',
      'Sem tentar mudar nada, só reconheça: "essa é uma frase que a minha autocrítica costuma dizer".',
    ],
    leveComVoce: 'Dar nome à voz crítica já cria uma pequena distância dela.',
    fontesCientificas: ['IC7'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s2',
    titulo: 'Pensamento não é veredito',
    descricaoCurta: 'Pratique transformar "eu sou" em "estou percebendo o pensamento de que".',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Quando um pensamento crítico chega no formato "eu sou assim", ele é sentido como um fato definitivo sobre quem você é. Reformulá-lo como algo que está passando pela mente cria distância: o pensamento continua ali, mas deixa de ter a última palavra. Essa é a lógica de abordagens baseadas em aceitação e valores, que em uma meta-análise de dezenas de ensaios tiveram resultados melhores que lista de espera e comparáveis aos da terapia cognitivo-comportamental. A ideia não é fazer o pensamento sumir — é conseguir seguir com o seu dia mesmo com ele por perto.',
    praticaGuiada: [
      'Pegue a frase de autocrítica que você identificou na sessão anterior, ou outra que apareça agora.',
      'Reescreva começando com "Estou percebendo o pensamento de que...".',
      'Leia as duas versões, em voz alta ou mentalmente, e note se muda alguma coisa na sensação — mesmo que mude pouco.',
      'Escolha uma coisa que você ia fazer de qualquer jeito e faça, com o pensamento ainda presente.',
    ],
    leveComVoce: 'Um pensamento pode atravessar a sua mente sem ser a última palavra sobre você.',
    fontesCientificas: ['CO7'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s3',
    titulo: 'Uma resposta firme e gentil',
    descricaoCurta: 'Construa uma resposta realista para dar à sua autocrítica.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Depois de reconhecer a voz crítica, o passo seguinte não é forçar um pensamento positivo artificial, que costuma soar falso. É construir uma resposta realista: firme o bastante para não alimentar a crítica, gentil o bastante para não virar outra forma de cobrança. Práticas breves de escrita autocompassiva estiveram associadas a menos sofrimento com a imagem corporal em estudos curtos, sem que isso signifique resolver a questão de vez.',
    praticaGuiada: [
      'Releia a frase de autocrítica que você identificou.',
      'Escreva uma resposta realista e gentil ao mesmo tempo, por exemplo: "Eu não preciso concordar com esse pensamento para seguir com o meu dia."',
      'Evite frases que prometem virada imediata de sentimento. A ideia é uma resposta sustentável, não uma transformação instantânea.',
    ],
    leveComVoce: 'Uma resposta honesta e gentil sustenta mais do que uma frase positiva forçada.',
    fontesCientificas: ['IC7', 'IC8'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s4',
    titulo: 'Observar com neutralidade, no seu limite',
    descricaoCurta: 'Uma prática opcional de observação neutra, com alternativa sem espelho.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Esta prática convida a observar algo com atenção neutra, descrevendo cores, formas e sensações em vez de avaliar. Ela é opcional de ponta a ponta: nada aqui pede que você se olhe no espelho, se fotografe ou meça qualquer coisa. Se o desconforto aumentar em qualquer momento, parar é uma resposta completa, não uma desistência.',
    praticaGuiada: [
      'Escolha o que observar, e você decide o quanto: pode ser sua mão, um trecho da roupa que está usando ou, se preferir não olhar para nada, apenas as sensações do corpo de olhos fechados — a alternativa sem espelho vale igual.',
      'Descreva mentalmente só o que percebe: cor, forma, textura, temperatura, peso do apoio no chão — sem palavras de julgamento.',
      'Se surgir uma avaliação, note que é um pensamento e volte para a descrição, ou encerre por aqui se preferir.',
      'Ao terminar (no ponto em que você escolher), respire no seu ritmo por alguns instantes.',
    ],
    leveComVoce: 'Você escolhe até onde ir nesta prática. Parar quando quiser também é uma resposta válida.',
    fontesCientificas: ['IC1'],
    avisoSeguranca:
      'Esta prática é totalmente opcional e pode ser interrompida a qualquer momento. Ela não pede espelho, foto nem medição do corpo — a versão só com sensações é equivalente. Se checar o corpo repetidamente já é algo que ocupa muito do seu dia e traz sofrimento, vale conversar com um profissional de saúde mental.',
  }),
]);

const IC_M5 = modulo('imagem-corporal-m5', 'Neutralidade corporal e autocompaixão', [
  sessao({
    id: 'imagem-corporal-m5-s1',
    titulo: 'Não preciso amar para respeitar',
    descricaoCurta: 'Conheça a neutralidade corporal como postura prática, não como tratamento.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Muita mensagem sobre imagem corporal exige "amar o próprio corpo", o que em dias difíceis soa como mais uma cobrança impossível. A neutralidade corporal propõe outra postura: se relacionar com o corpo por respeito e funcionalidade, sem depender de sentir amor por ele. Vale dizer com clareza que essa é uma postura prática do dia a dia, e não um tratamento validado — a evidência disponível é inicial e vem de estudos curtos de exposição a conteúdo.',
    praticaGuiada: [
      'Leia devagar a frase: "Eu não preciso amar meu corpo para tratá-lo com respeito."',
      'Pense numa forma de respeito que não depende de gostar da aparência — descansar quando está cansada, vestir algo confortável, comer com calma.',
      'Anote essa forma de respeito como um lembrete para os dias em que amar o corpo parecer distante demais.',
    ],
    leveComVoce: 'Respeito é uma meta possível em qualquer dia — amor incondicional nem sempre é.',
    fontesCientificas: ['IC9'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s2',
    titulo: 'Pausa de autocompaixão',
    descricaoCurta: 'Pratique uma pausa breve de reconhecimento e apoio interno.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma pausa de autocompaixão tem três partes: reconhecer que o momento é difícil, lembrar que dificuldade faz parte de ser humana, e oferecer a si mesma uma frase de apoio. Ela não resolve o problema e não faz a emoção desaparecer — em estudos curtos, práticas assim estiveram associadas a menos sofrimento ligado à imagem corporal, com adesão irregular e efeitos modestos.',
    praticaGuiada: [
      'Traga à mente um momento recente de desconforto com o seu corpo.',
      'Reconheça em silêncio: "este é um momento difícil".',
      'Lembre-se: "desconforto com o corpo é algo que muita gente sente; não é uma falha minha".',
      'Escolha uma frase de apoio para si mesma, no tom que você usaria com alguém querido.',
    ],
    leveComVoce: 'Você não precisa atravessar esse desconforto sozinha — ele é mais comum do que parece.',
    fontesCientificas: ['IC7'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s3',
    titulo: 'Um gesto de segurança, se fizer sentido',
    descricaoCurta: 'Experimente um gesto físico opcional de acolhimento, no seu ritmo.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Um gesto físico simples — a mão sobre o peito, os braços cruzados num abraço leve, as mãos entrelaçadas no colo — pode acompanhar um momento de autocompaixão. É totalmente opcional: se nenhum gesto parecer confortável, respirar no ritmo natural já cumpre a prática inteira.',
    praticaGuiada: [
      'Se quiser, escolha um gesto: mão sobre o peito, abraço leve nos próprios braços ou mãos entrelaçadas.',
      'Mantendo o gesto — ou apenas respirando, se preferir não fazer nenhum — respire no seu ritmo natural, sem forçar nada.',
      'Fique nesse momento por alguns instantes, sem pressa de terminar.',
    ],
    leveComVoce: 'Não existe forma certa de fazer isto. O que for confortável para você já basta.',
    fontesCientificas: ['IC7'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s4',
    titulo: 'Carta de respeito ao meu corpo',
    descricaoCurta: 'Escreva uma carta breve reconhecendo limites, necessidades e funções.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Escrever para o próprio corpo, com foco em limites, necessidades e funções — e não em elogios de aparência — é uma forma de reunir o que este módulo trabalhou. Escrita autocompassiva depois de exposição a imagens idealizadas apareceu, em um estudo de laboratório, como a estratégia que mais ajudou a recuperar satisfação corporal naquele momento. Não precisa ser uma carta de amor; basta ser honesta.',
    praticaGuiada: [
      'Comece com "Para o meu corpo," ou com qualquer abertura que faça sentido para você.',
      'Reconheça um limite que ele tem: cansaço, necessidade de descanso, algo que dói.',
      'Reconheça uma necessidade que ele sinaliza: comida, sono, movimento, pausa.',
      'Reconheça uma função que ele cumpre no seu dia a dia.',
      'Termine como quiser — não precisa ser uma declaração de amor, só de respeito.',
    ],
    leveComVoce: 'Uma carta honesta vale mais do que uma carta perfeita.',
    fontesCientificas: ['IC8'],
  }),
]);

const IC_M6 = modulo('imagem-corporal-m6', 'Influência das redes sociais', [
  sessao({
    id: 'imagem-corporal-m6-s1',
    titulo: 'O feed é montado para prender atenção',
    descricaoCurta: 'Entenda por que o feed não é uma amostra neutra da vida real.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'O feed não mostra a vida real de forma neutra: ele é organizado por um sistema que aprende o que prende sua atenção e entrega mais daquilo. Corpos, comparações e conteúdo emocionalmente intenso costumam prender atenção, então aparecem mais — o que produz uma amostra distorcida. Isso não torna as redes um vilão; torna importante saber que o que chega até você foi selecionado.',
    praticaGuiada: [
      'Pense no feed que você mais usa e lembre de três a cinco tipos de conteúdo que aparecem com mais frequência.',
      'Para cada um, pergunte-se: isso prende minha atenção por interesse real, ou por gerar uma reação forte?',
      'Escreva uma frase reconhecendo que o feed é construído, e não um espelho da vida das pessoas.',
    ],
    leveComVoce: 'O que aparece no seu feed foi selecionado para prender atenção — não é uma amostra aleatória da vida.',
    fontesCientificas: ['IC3', 'IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s2',
    titulo: 'Como o meu feed me faz sentir',
    descricaoCurta: 'Faça uma auditoria rápida das contas e conteúdos que você mais vê.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma auditoria simples do próprio feed torna visível um padrão que passa despercebido no dia a dia: quais conteúdos deixam você bem e quais deixam insegura. Em um estudo com vídeos curtos de exercício e corpo, assistir a esse tipo de conteúdo esteve associado a mais comparação de aparência e piora de humor logo depois — sem que a insatisfação corporal mudasse diretamente.',
    praticaGuiada: [
      'Liste cerca de dez contas ou tipos de conteúdo que você mais vê — perfis específicos ou categorias.',
      'Para cada um, marque rapidamente: me faz sentir bem, neutra, ou insegura.',
      'Conte quantos ficaram em cada categoria e olhe o resultado sem tirar conclusões apressadas.',
    ],
    reflexao: 'Alguma coisa te surpreendeu ao montar essa lista?',
    leveComVoce: 'Você não precisa mudar nada ainda — só está com mais clareza sobre o que consome.',
    fontesCientificas: ['IC4', 'IC3'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s3',
    titulo: 'Curadoria também é autocuidado',
    descricaoCurta: 'Ajuste seu feed: silencie o que gera comparação, inclua outras referências.',
    duracaoMinutos: 5,
    tipo: 'plano',
    entendaEm1Minuto:
      'Cuidar do próprio feed — silenciar, deixar de seguir, adicionar contas diferentes — é uma escolha legítima de autocuidado, e não uma fuga. Há evidência inicial de que conteúdo que trata corpos de forma neutra ou acolhedora está associado a menos afeto negativo do que conteúdo que estigmatiza peso. Você não deve explicação a ninguém por essas escolhas.',
    praticaGuiada: [
      'Com base na auditoria da sessão anterior, escolha ao menos uma conta ou tipo de conteúdo que gera comparação para silenciar ou deixar de seguir.',
      'Pense num tipo de conteúdo diferente para acrescentar — algo ligado a um interesse seu que não tenha relação com aparência.',
      'Se puder, faça esses ajustes agora; se não, anote para fazer nos próximos dias.',
    ],
    leveComVoce: 'Escolher o que entra no seu feed é o mesmo tipo de cuidado que escolher com quem passar o tempo.',
    fontesCientificas: ['IC9', 'IC5'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s4',
    titulo: 'Um experimento de sete dias com as redes',
    descricaoCurta: 'Teste um ajuste temporário de uso e observe o efeito de curto prazo.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Em um ensaio pequeno, universitárias que pausaram as redes por sete dias relataram, ao fim da semana, mais autoestima e mais satisfação corporal do que quem manteve o uso habitual. É importante o que esse estudo não mostra: ele não acompanhou o que acontece depois que as redes voltam, então trate isso como um benefício de curto prazo e um experimento de observação, nunca como uma solução permanente.',
    praticaGuiada: [
      'Escolha um ajuste simples para os próximos sete dias: um horário sem redes, um tempo máximo por dia, ou não abrir certos apps logo ao acordar.',
      'Escolha uma atividade substituta para os momentos em que você normalmente abriria o app: ler, caminhar, ligar para alguém.',
      'Anote como você se sente no começo e no fim da semana, em poucas palavras.',
      'No sétimo dia, decida com base no que observou — e lembre que o efeito medido nos estudos é de curto prazo.',
    ],
    leveComVoce: 'É um experimento de sete dias, não uma promessa para sempre. O que você aprender é seu.',
    fontesCientificas: ['IC6'],
  }),
]);

const JORNADA_IMAGEM_CORPORAL: Jornada = {
  id: 'imagem-corporal',
  slug: 'imagem-corporal',
  titulo: 'Imagem corporal',
  descricaoCurta: 'Uma jornada para cultivar uma relação mais gentil com o seu corpo.',
  corCartao: 'pessego',
  modulos: [IC_M1, IC_M2, IC_M3, IC_M4, IC_M5, IC_M6],
};

// ============================================================
// JORNADA 2 — AUTOCOMPAIXÃO (7 módulos, 21 sessões)
// ============================================================

const AC_M1 = modulo('autocompaixao-m1', 'Crítica interna', [
  sessao({
    id: 'autocompaixao-m1-s1',
    titulo: 'O que eu digo para mim',
    descricaoCurta: 'Identifique as frases, o tom e as situações da sua crítica interna.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'A crítica interna costuma ter vocabulário e tom próprios, quase como uma voz separada. Reconhecer as frases exatas e as situações em que ela aparece é o primeiro passo para responder de outro jeito. Em um conjunto de ensaios clínicos, práticas voltadas à autocompaixão estiveram associadas a uma redução moderada da autocrítica — redução, não desaparecimento.',
    praticaGuiada: [
      'Lembre de um momento recente em que sua crítica interna falou alto.',
      'Anote a frase exata que ela disse e o tom usado: duro, sarcástico, decepcionado.',
      'Anote a situação que disparou essa crítica.',
    ],
    leveComVoce: 'Reconhecer o padrão da crítica interna já é um passo — sem precisar concordar com ela.',
    fontesCientificas: ['AC2', 'AC1'],
  }),
  sessao({
    id: 'autocompaixao-m1-s2',
    titulo: 'O que essa crítica tenta evitar',
    descricaoCurta: 'Explore que função protetora, ainda que desajeitada, a crítica pode cumprir.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Com frequência a crítica interna aparece tentando evitar alguma coisa: rejeição, erro, perda de controle. Entender essa intenção não justifica o tom agressivo que ela usa, mas costuma tornar a conversa interna menos travada do que ficar em oposição direta a ela.',
    praticaGuiada: [
      'Pegue a crítica que você identificou na sessão anterior.',
      'Pergunte-se: o que ela está tentando evitar que aconteça?',
      'Escreva uma frase reconhecendo essa intenção sem aceitar o tom: "Entendo que você quer me proteger de algo, mas esse jeito não está ajudando."',
    ],
    leveComVoce: 'Entender a intenção da crítica não é concordar com o jeito que ela fala com você.',
    fontesCientificas: ['AC2', 'AC4'],
  }),
  sessao({
    id: 'autocompaixao-m1-s3',
    titulo: 'Da crítica para a orientação',
    descricaoCurta: 'Reescreva uma cobrança interna como instrução clara e possível.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Muita crítica interna chega como cobrança vaga: "você deveria ser melhor". Transformar isso em orientação específica e realizável é mais útil e mais gentil ao mesmo tempo, porque oferece um caminho no lugar de um julgamento. Isso não significa abrir mão de exigência nenhuma — significa trocar julgamento por direção.',
    praticaGuiada: [
      'Escolha uma cobrança recente da sua crítica interna.',
      'Reescreva como instrução específica e possível: de "você deveria dar conta de tudo" para "hoje posso focar em uma coisa de cada vez".',
      'Leia a nova versão e note a diferença de sensação, mesmo que seja pequena.',
    ],
    leveComVoce: 'Uma instrução clara leva você mais longe do que uma cobrança vaga.',
    fontesCientificas: ['AC4', 'AC2'],
  }),
]);

const AC_M2 = modulo('autocompaixao-m2', 'Culpa', [
  sessao({
    id: 'autocompaixao-m2-s1',
    titulo: 'Culpa não é identidade',
    descricaoCurta: 'Diferencie "fiz algo que não gostei" de "sou uma pessoa ruim".',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Existe diferença entre sentir culpa por uma ação específica e concluir que você é, no fundo, uma pessoa ruim. A primeira aponta para um comportamento; a segunda vira identidade, e identidade é bem mais difícil de revisar. Não dá para dizer que a culpa seja sempre útil ou sempre nociva: para muitas pessoas ela sinaliza algo importante, para outras ela chega desproporcional, e isso varia caso a caso.',
    praticaGuiada: [
      'Pense numa situação recente que gerou culpa.',
      'Escreva a versão "ação": o que exatamente você fez ou deixou de fazer.',
      'Escreva a versão "identidade" que a sua mente talvez tenha criado, começando com "eu sou...".',
      'Compare as duas frases e note qual delas é mais específica e mais fácil de trabalhar.',
    ],
    leveComVoce: 'Um comportamento pode ser revisto. Uma identidade fixa é bem mais pesada de carregar.',
    fontesCientificas: ['AC1'],
  }),
  sessao({
    id: 'autocompaixao-m2-s2',
    titulo: 'Reconhecer, reparar e aprender',
    descricaoCurta: 'Separe o que dá para reparar, o que dá para aprender e o que resta deixar ir.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Diante de uma culpa concreta, ajuda separar três caminhos: o que dá para reparar, o que dá para aprender e o que só resta deixar ir porque já passou. Ser gentil consigo mesma aqui não significa se eximir — autocompaixão inclui responsabilidade, e nenhum destes passos pede que você finja que nada aconteceu.',
    praticaGuiada: [
      'Traga à mente a situação que gerou culpa.',
      'Pergunte: existe algo que eu posso reparar aqui? Se sim, o quê?',
      'Pergunte: existe algo que eu posso aprender para uma próxima vez?',
      'Pergunte: existe uma parte disso que só resta deixar ir?',
      'Escreva as três respostas, mesmo que alguma delas seja "nada a fazer aqui".',
    ],
    leveComVoce: 'Nem toda culpa pede reparação — às vezes ela pede reconhecimento e aprendizado.',
    fontesCientificas: ['AC1', 'AC3'],
  }),
  sessao({
    id: 'autocompaixao-m2-s3',
    titulo: 'Quando continuar se punindo não ajuda',
    descricaoCurta: 'Crie uma frase de responsabilidade que não vire punição permanente.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Se responsabilizar e se punir sem prazo são coisas diferentes. A responsabilidade tem começo, meio e fim: reconhecer, reparar quando possível, seguir. A punição indefinida costuma prolongar o sofrimento sem produzir mudança. Como as pessoas reagem à culpa varia bastante — para algumas ela mobiliza, para outras ela paralisa, e nenhuma das duas reações é um defeito.',
    praticaGuiada: [
      'Pense em algo que você ainda está "pagando" mentalmente, mesmo já tendo reconhecido e feito o possível.',
      'Escreva uma frase de responsabilidade que tenha um fim, por exemplo: "Eu reconheço o que aconteceu, fiz o que estava ao meu alcance e agora sigo."',
      'Releia essa frase sempre que a autopunição voltar sobre esse mesmo assunto.',
    ],
    leveComVoce: 'Responsabilidade tem um propósito. Punição sem fim só desgasta.',
    fontesCientificas: ['AC1', 'AC2'],
  }),
]);

const AC_M3 = modulo('autocompaixao-m3', 'Vergonha', [
  sessao({
    id: 'autocompaixao-m3-s1',
    titulo: 'A vergonha pede silêncio',
    descricaoCurta: 'Entenda por que a vergonha empurra para o isolamento e o segredo.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'A vergonha costuma vir com uma sensação de defeito: não "eu fiz algo errado", mas "há algo errado comigo". Essa sensação tende a empurrar para o silêncio, porque esconder parece mais seguro do que mostrar. Isso descreve uma tendência comum, não uma regra: nem toda vergonha é destrutiva, e algumas pessoas conseguem usá-la como sinal de que algo importa. O que costuma pesar é quando ela vira segredo prolongado.',
    praticaGuiada: [
      'Pense em algo que você guarda com vergonha, mesmo que pareça pequeno.',
      'Note se a sensação é mais de "eu fiz algo errado" ou de "há algo errado comigo".',
      'Sem precisar compartilhar com ninguém agora, reconheça: "isso é vergonha, e ela está me pedindo silêncio".',
    ],
    leveComVoce: 'Nomear a vergonha tira um pouco do poder que ela tem sobre você.',
    fontesCientificas: ['AC7'],
  }),
  sessao({
    id: 'autocompaixao-m3-s2',
    titulo: 'Eu não sou a única',
    descricaoCurta: 'Pratique a humanidade compartilhada sem minimizar a sua dor.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Humanidade compartilhada é um dos três elementos centrais da autocompaixão, junto com gentileza consigo mesma e atenção plena ao próprio sofrimento. Ela lembra que errar e sofrer fazem parte da experiência humana. Isso não é o mesmo que minimizar o que você sente — sua dor continua sendo sua e continua importando.',
    praticaGuiada: [
      'Traga à mente a situação de vergonha que você reconheceu na sessão anterior.',
      'Complete a frase: "Muitas pessoas, em algum momento, já sentiram algo parecido com isto."',
      'Note que reconhecer isso não apaga a sua dor — apenas lembra que ela é humana, não uma falha exclusiva sua.',
    ],
    leveComVoce: 'Sentir vergonha não te separa das outras pessoas. Te coloca junto delas.',
    fontesCientificas: ['AC1'],
  }),
  sessao({
    id: 'autocompaixao-m3-s3',
    titulo: 'Uma carta para a parte que sente vergonha',
    descricaoCurta: 'Escreva uma carta autocompassiva e decida, sem obrigação, se quer compartilhar.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Escrever para si mesma com o tom que você usaria com alguém querido é uma prática que, num programa de duas semanas com pessoas com muita vergonha, esteve associada a reduções de vergonha, autocrítica e ansiedade mantidas um mês depois. Uma carta escrita hoje não equivale a esse programa — mas o gesto é o mesmo, e pode ser repetido.',
    praticaGuiada: [
      'Escreva algumas linhas descrevendo a situação de vergonha, sem enfeitar e sem se atacar.',
      'Continue a carta como se estivesse escrevendo para uma amiga querida que vivesse exatamente isso.',
      'Inclua uma frase que reconheça o que foi difícil e outra que reconheça o que você fez do seu jeito possível.',
      'Se existir alguém de confiança e você quiser, considere compartilhar algo disso — é uma escolha inteiramente sua, nunca uma obrigação, e guardar para si é igualmente válido.',
    ],
    reflexao: 'O que ficou diferente ao escrever para si mesma nesse tom?',
    leveComVoce: 'Você pode ser a primeira pessoa a falar com gentileza sobre aquilo que te envergonha.',
    fontesCientificas: ['AC7', 'AC1'],
    avisoSeguranca:
      'O Rose é conteúdo educativo e não substitui tratamento. Se a vergonha vier acompanhada de autopunição, isolamento prolongado ou pensamentos de que você não merece coisas boas, vale conversar com um profissional de saúde mental.',
  }),
]);

const AC_M4 = modulo('autocompaixao-m4', 'Gentileza consigo mesma', [
  sessao({
    id: 'autocompaixao-m4-s1',
    titulo: 'O tom que eu usaria com alguém querido',
    descricaoCurta: 'Compare a linguagem que você usa consigo e a que oferece a uma amiga.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Um jeito simples de notar a distância entre autocrítica e gentileza é comparar dois textos: o que a sua mente diz para você e o que você diria a uma amiga na mesma situação. A diferença costuma ser grande. Isso não significa que gentileza seja concordar com tudo ou baixar as suas metas — é mudar o tom, não o padrão.',
    praticaGuiada: [
      'Pense numa dificuldade sua deste momento.',
      'Escreva o que a sua mente diz sobre isso para você mesma.',
      'Escreva o que você diria a uma amiga querida na mesma situação.',
      'Coloque as duas versões lado a lado e leia as duas em sequência.',
    ],
    reflexao: 'O que te impede de falar consigo do mesmo jeito que falaria com uma amiga?',
    leveComVoce: 'Você merece pelo menos a mesma gentileza que ofereceria a quem você ama.',
    fontesCientificas: ['AC1', 'AC3'],
  }),
  sessao({
    id: 'autocompaixao-m4-s2',
    titulo: 'Um pequeno gesto de cuidado',
    descricaoCurta: 'Escolha uma ação viável de dois minutos para se cuidar hoje.',
    duracaoMinutos: 5,
    tipo: 'plano',
    entendaEm1Minuto:
      'Gentileza consigo mesma não precisa de um gesto grandioso nem de um momento perfeito. Um programa estruturado de autocompaixão leva semanas e tem efeitos que se sustentam ao longo do tempo; uma ação de dois minutos é outra coisa, bem menor — e ainda assim é o tipo de repetição que constrói o hábito.',
    praticaGuiada: [
      'Pense numa ação de cuidado de dois minutos: beber água, esticar o corpo, respirar devagar três vezes, escrever uma frase gentil.',
      'Escolha uma e faça agora, se for possível.',
      'Note como foi permitir esse pequeno momento para si mesma, mesmo que a sensação tenha sido discreta.',
    ],
    leveComVoce: 'Gentileza consigo mesma pode caber em dois minutos.',
    fontesCientificas: ['AC3'],
  }),
  sessao({
    id: 'autocompaixao-m4-s3',
    titulo: 'Gentileza também pode ser ação',
    descricaoCurta: 'Transforme apoio interno em descanso, organização, pedido de ajuda ou limite.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Nem sempre gentileza consigo mesma é uma frase de conforto. Às vezes é uma ação prática: descansar, organizar o que está pesando, pedir ajuda, colocar um limite. Vista assim, ela não tem nada a ver com se poupar de responsabilidades — muitas vezes é justamente o que permite assumi-las de forma sustentável.',
    praticaGuiada: [
      'Pense em qual área da sua vida está pedindo cuidado prático agora: descanso, organização, ajuda de alguém, ou um limite.',
      'Escolha uma ação concreta nessa área — pequena o suficiente para caber na sua semana.',
      'Anote quando você pretende fazer essa ação.',
    ],
    leveComVoce: 'Às vezes o gesto mais gentil é uma ação prática, não uma frase de conforto.',
    fontesCientificas: ['AC1', 'AC3'],
  }),
]);

const AC_M5 = modulo('autocompaixao-m5', 'Aceitação das imperfeições', [
  sessao({
    id: 'autocompaixao-m5-s1',
    titulo: 'O custo de precisar acertar sempre',
    descricaoCurta: 'Mapeie como o perfeccionismo gera adiamento, exaustão e medo.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Precisar acertar sempre cobra um preço concreto: tarefas adiadas por medo de errar, exaustão de tentar controlar tudo, medo constante de julgamento. Perfeccionismo prejudicial é justamente o alvo de programas terapêuticos de várias semanas, que reduziram esses sintomas em ensaios clínicos. Mapear o custo é um começo bem menor do que isso, mas é um começo.',
    praticaGuiada: [
      'Pense numa área da sua vida em que você sente que precisa acertar sempre.',
      'Anote um exemplo concreto de algo que você adiou por medo de não fazer perfeito.',
      'Anote como essa exigência aparece no seu corpo: cansaço, tensão, aperto, insônia.',
    ],
    leveComVoce: 'Perceber o custo do perfeccionismo não é fraqueza — é o primeiro passo para aliviá-lo.',
    fontesCientificas: ['AC5'],
  }),
  sessao({
    id: 'autocompaixao-m5-s2',
    titulo: 'Um experimento pequeno e seguro',
    descricaoCurta: 'Faça uma tarefa de baixo risco com o critério "bom o bastante".',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      '"Bom o bastante" é um critério diferente de "perfeito": cumpre o propósito sem exigir excelência em cada detalhe. Este é um experimento comportamental em escala mínima, e a escala importa. Escolha algo cotidiano e reversível — nunca uma entrega acadêmica ou profissional avaliada, uma decisão de saúde, um compromisso financeiro ou qualquer coisa cujo resultado você não possa refazer.',
    praticaGuiada: [
      'Escolha uma tarefa pequena e sem consequências relevantes: arrumar uma gaveta, responder uma mensagem informal, cozinhar algo simples.',
      'Confirme que ela não envolve estudo avaliado, trabalho avaliado, saúde ou dinheiro. Se envolver, escolha outra.',
      'Antes de começar, defina o que seria "bom o bastante" nesse caso: funcional, não impecável.',
      'Faça a tarefa com esse critério e observe o resultado real, sem comparar com o ideal imaginado.',
    ],
    leveComVoce: '"Bom o bastante" costuma ser suficiente — e custa muito menos.',
    fontesCientificas: ['AC5'],
  }),
  sessao({
    id: 'autocompaixao-m5-s3',
    titulo: 'Revisar sem se humilhar',
    descricaoCurta: 'Olhe o que funcionou, o que mudaria e qual é o próximo passo.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Revisar uma experiência sem se humilhar significa observar o que funcionou e o que poderia mudar, sem transformar isso num veredito sobre o seu valor. É uma habilidade e, como as outras desta jornada, melhora com repetição — e é bem diferente de deixar de ter padrões.',
    praticaGuiada: [
      'Pense na tarefa "bom o bastante" que você fez, ou em qualquer tarefa recente.',
      'Anote o que funcionou bem nela.',
      'Anote uma coisa que você faria diferente na próxima vez, escrita como ajuste e não como crítica.',
      'Se fizer sentido, defina um próximo passo pequeno.',
    ],
    leveComVoce: 'Revisar com curiosidade ensina mais do que revisar com julgamento.',
    fontesCientificas: ['AC5', 'AC2'],
  }),
]);

const AC_M6 = modulo('autocompaixao-m6', 'Regulação emocional', [
  sessao({
    id: 'autocompaixao-m6-s1',
    titulo: 'Nomear o que está acontecendo',
    descricaoCurta: 'Identifique a emoção, a intensidade e onde ela aparece no corpo.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Colocar em palavras o que se sente é uma das práticas mais simples de regulação emocional. Em um estudo de neuroimagem, nomear a emoção diante de uma imagem que provoca reação esteve associado a uma resposta cerebral menos intensa do que apenas olhar. Isso é um resultado de laboratório e num momento único: nomear pode reduzir a intensidade, não fazer a emoção ir embora.',
    praticaGuiada: [
      'Pare por um instante e pergunte: o que eu estou sentindo agora?',
      'Dê um nome simples a essa emoção: ansiedade, tristeza, raiva, cansaço, irritação.',
      'Numa escala pessoal de 1 a 10, note a intensidade.',
      'Note onde no corpo essa emoção aparece.',
    ],
    leveComVoce: 'Nomear uma emoção não a resolve, mas costuma dar um pouco mais de espaço para lidar com ela.',
    fontesCientificas: ['AC6'],
  }),
  sessao({
    id: 'autocompaixao-m6-s2',
    titulo: 'Abrir espaço sem se afogar',
    descricaoCurta: 'Use os sentidos para se aterrar enquanto a emoção existe.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Dar espaço a uma emoção difícil não é se afogar nela. Atenção plena ao próprio sofrimento — um dos elementos da autocompaixão — é justamente esse meio-termo: nem empurrar a emoção para longe, nem se identificar totalmente com ela. Uma âncora nos sentidos ajuda a ficar presente enquanto a emoção passa por você.',
    praticaGuiada: [
      'Note a emoção presente sem tentar mudá-la ainda.',
      'Observe algo que você pode ver ao seu redor.',
      'Observe algo que você pode ouvir.',
      'Observe algo que você pode sentir tocando: a roupa, a cadeira, o chão.',
      'Permita que a emoção exista mais alguns instantes, agora com esse apoio.',
    ],
    leveComVoce: 'Dá para sentir uma emoção difícil e, ao mesmo tempo, continuar presente.',
    fontesCientificas: ['AC1', 'AC6'],
  }),
  sessao({
    id: 'autocompaixao-m6-s3',
    titulo: 'Escolher o próximo passo',
    descricaoCurta: 'Monte um menu pessoal: acalmar, resolver ou procurar apoio.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de nomear e dar espaço a uma emoção, ajuda ter um pequeno menu de respostas possíveis, porque nem toda emoção pede a mesma coisa. Às vezes o que cabe é acalmar; às vezes, resolver algo prático; às vezes, procurar alguém. Ter as três opções à vista evita cair sempre na mesma resposta automática.',
    praticaGuiada: [
      'Escreva as três categorias: acalmar (respirar, descansar), resolver (agir sobre algo prático) e buscar apoio (falar com alguém).',
      'Para a emoção que você sente agora ou sentiu recentemente, escolha qual categoria parece mais adequada.',
      'Defina uma ação concreta dentro dessa categoria e quando ela acontece.',
    ],
    leveComVoce: 'Nem toda emoção pede a mesma resposta — ter opções facilita escolher.',
    fontesCientificas: ['AC1', 'AC4'],
  }),
]);

const AC_M7 = modulo('autocompaixao-m7', 'Cuidado pessoal e voz interior acolhedora', [
  sessao({
    id: 'autocompaixao-m7-s1',
    titulo: 'Do que eu preciso agora?',
    descricaoCurta: 'Diferencie necessidade física, emocional, prática e relacional.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Às vezes um desconforto difuso esconde uma necessidade bem específica que ainda não foi identificada. Separar necessidades em categorias — física, emocional, prática e relacional — torna mais fácil encontrar o que está faltando de verdade, em vez de responder no automático.',
    praticaGuiada: [
      'Pare e pergunte: do que eu preciso agora?',
      'Passe pelas quatro categorias: física (descanso, comida, movimento), emocional (conforto, acolhimento), prática (organizar algo, resolver uma pendência), relacional (conversar, pedir ajuda).',
      'Identifique qual delas parece mais presente neste momento e escreva em uma frase.',
    ],
    leveComVoce: 'Identificar a necessidade certa já é metade do caminho para atendê-la.',
    fontesCientificas: ['AC1'],
  }),
  sessao({
    id: 'autocompaixao-m7-s2',
    titulo: 'Um limite também é cuidado',
    descricaoCurta: 'Crie uma frase curta e respeitosa para dizer não, pedir tempo ou renegociar.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Colocar um limite — dizer não, pedir mais prazo, renegociar um combinado — é uma forma de cuidado com você e com a relação. Ter uma frase preparada evita a sensação de estar improvisando justo no momento mais tenso. Limite não é indiferença: você continua responsável pelo que assume.',
    praticaGuiada: [
      'Pense numa situação em que colocar um limite te faria bem.',
      'Escreva uma frase curta e respeitosa para isso, por exemplo: "Não vou conseguir agora, mas posso na próxima semana."',
      'Guarde essa frase, ou o formato dela, para reusar quando precisar.',
    ],
    leveComVoce: 'Um limite bem colocado é cuidado, não rejeição.',
    fontesCientificas: ['AC1', 'AC4'],
  }),
  sessao({
    id: 'autocompaixao-m7-s3',
    titulo: 'Meu cartão de apoio',
    descricaoCurta: 'Reúna três frases realistas e três ações de cuidado que funcionam para você.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Esta última sessão reúne o que a jornada trabalhou num pequeno cartão pessoal: frases de apoio realistas e ações de cuidado, para consultar em dias difíceis. Um cartão não substitui um programa estruturado de autocompaixão, que dura semanas e conta com acompanhamento — ele é um lembrete prático do que você já construiu aqui.',
    praticaGuiada: [
      'Escreva três frases de apoio realistas — nada de positividade forçada — que você gostaria de ouvir de si mesma em dias difíceis.',
      'Escreva três ações de cuidado que você já sabe que funcionam para você.',
      'Guarde as seis juntas em algum lugar de fácil acesso: esse é o seu cartão de apoio.',
    ],
    reflexao: 'Qual dessas seis coisas você acha que vai usar primeiro?',
    leveComVoce: 'Você acabou de construir um lembrete seu, escrito por você, para os seus dias difíceis.',
    fontesCientificas: ['AC3', 'AC1'],
  }),
]);

const JORNADA_AUTOCOMPAIXAO: Jornada = {
  id: 'autocompaixao',
  slug: 'autocompaixao',
  titulo: 'Autocompaixão',
  descricaoCurta: 'Práticas para desenvolver uma voz interior mais gentil e acolhedora.',
  corCartao: 'creme-rosado',
  modulos: [AC_M1, AC_M2, AC_M3, AC_M4, AC_M5, AC_M6, AC_M7],
};

// ============================================================
// JORNADA 3 — COMPARAÇÃO (6 módulos, 18 sessões)
// ============================================================

const CP_M1 = modulo('comparacao-m1', 'Comparação social', [
  sessao({
    id: 'comparacao-m1-s1',
    titulo: 'O que é comparação social',
    descricaoCurta: 'Conheça a definição e mapeie quando ela aparece na sua rotina.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comparação social é o processo de avaliar aspectos de si mesma usando outras pessoas como referência: aparência, conquistas, relações, ritmo de vida. É um processo humano e frequente, que acontece muitas vezes sem que a gente perceba, e não vai deixar de existir — a proposta desta jornada não é eliminá-lo, e sim reduzir o quanto ele dita como você se sente. Nem toda comparação faz mal; algumas informam e até inspiram. O que costuma pesar é quando ela vira medida constante de valor pessoal.',
    praticaGuiada: [
      'Pense nos últimos dias e escolha um momento em que você se comparou com alguém.',
      'Anote quatro informações: com quem (ou com o quê), sobre qual assunto, em que ambiente e em que horário.',
      'Repita para outro momento, se lembrar de mais de um.',
      'Olhe os registros lado a lado e note se há algo em comum entre eles.',
    ],
    reflexao: 'Existe um horário ou ambiente em que a comparação aparece com mais força?',
    leveComVoce: 'Comparar é humano e vai continuar acontecendo. Ver o padrão é o que muda o jogo.',
    fontesCientificas: ['CO2', 'CO3'],
  }),
  sessao({
    id: 'comparacao-m1-s2',
    titulo: 'Eu vejo um recorte, não a vida inteira',
    descricaoCurta: 'Trabalhe a diferença entre o que é visível e o que fica de fora.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Quando você compara a sua vida inteira — com dúvidas, cansaço e dias ruins — com o recorte visível da vida de outra pessoa, a conta já começa desequilibrada. Em uma revisão de muitos estudos, maior tendência a se comparar nas redes apareceu associada a mais preocupação com o corpo e com a alimentação. É uma associação observada, o que significa que não dá para afirmar que uma coisa causa a outra.',
    praticaGuiada: [
      'Pense numa comparação recente que te incomodou.',
      'Liste em uma coluna o que você viu de fato e, na outra, o que você não tem como saber sobre o resto da vida daquela pessoa.',
      'Escreva uma frase reconhecendo que você comparou um recorte com a sua vida inteira.',
    ],
    leveComVoce: 'Um recorte contra uma vida inteira nunca foi uma comparação justa.',
    fontesCientificas: ['CO2'],
  }),
  sessao({
    id: 'comparacao-m1-s3',
    titulo: 'Uma pausa curta antes de reagir',
    descricaoCurta: 'Pratique notar, respirar, afastar o estímulo e escolher a próxima ação.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma pausa curta e estruturada abre espaço entre o impulso e o que você faz em seguida. Vamos usar cerca de um minuto e meio, e vale ser transparente sobre isso: essa duração é uma escolha prática, para ser curta o bastante para caber em qualquer situação, e não uma medida de quanto tempo uma emoção "dura". A ideia não é nunca comparar, é não ser conduzida pela comparação sem perceber.',
    praticaGuiada: [
      'Quando notar que está se comparando, pare onde estiver.',
      'Respire devagar três vezes, no seu ritmo natural, sem contar segundos.',
      'Tire a atenção do estímulo: feche o app, vire o rosto, mude de cômodo.',
      'Escolha conscientemente o que fazer em seguida, de acordo com o que importa para você naquele momento.',
    ],
    leveComVoce: 'A pausa não apaga a comparação — ela devolve para você a escolha do passo seguinte.',
    fontesCientificas: ['CO7'],
  }),
]);

const CP_M2 = modulo('comparacao-m2', 'Redes sociais', [
  sessao({
    id: 'comparacao-m2-s1',
    titulo: 'Como o feed seleciona o que eu vejo',
    descricaoCurta: 'Entenda o papel do algoritmo, da repetição e do engajamento.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'O que aparece no seu feed não é aleatório: um sistema aprende o que gera mais engajamento e entrega mais conteúdo parecido. Conteúdo que provoca comparação costuma engajar bem, então tende a se repetir. Estudos com adolescentes encontraram que usar as redes especificamente para se comparar e buscar validação estava mais associado a sintomas depressivos do que o tempo total de uso — associação, não relação de causa.',
    praticaGuiada: [
      'Pense num tipo de conteúdo que aparece repetidamente no seu feed.',
      'Pergunte-se: ele prende a minha atenção por interesse real ou por provocar uma reação forte?',
      'Escreva uma frase reconhecendo o papel do algoritmo nessa repetição.',
    ],
    leveComVoce: 'O que chega até você foi selecionado — e saber disso já muda a forma de olhar.',
    fontesCientificas: ['CO3', 'CO2'],
  }),
  sessao({
    id: 'comparacao-m2-s2',
    titulo: 'Ajustar sem precisar sumir',
    descricaoCurta: 'Faça uma curadoria de contas, palavras, horários e notificações.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Ajustar o feed não significa desaparecer das redes. Significa mudar a proporção do que chega até você, para que ele gere menos comparação automática. Silenciar uma conta, mutar uma palavra ou desligar uma notificação são mudanças pequenas, reversíveis e que você não precisa justificar para ninguém.',
    praticaGuiada: [
      'Escolha uma conta que costuma gerar comparação e silencie ou deixe de seguir.',
      'Se o app permitir, mute uma palavra-chave ou tópico que costuma te incomodar.',
      'Revise as notificações ativas e desligue ao menos uma que não seja necessária.',
    ],
    leveComVoce: 'Ajustar o que você consome é cuidado, não fuga.',
    fontesCientificas: ['CO2'],
  }),
  sessao({
    id: 'comparacao-m2-s3',
    titulo: 'Intenção antes de abrir o app',
    descricaoCurta: 'Defina uma intenção por sete dias e pratique celebrar o que é dos outros.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Definir uma intenção antes de abrir o app ("vou responder uma mensagem" em vez de "vou dar uma olhada") muda a forma de usar. Junto disso, existe uma prática testada em um piloto de duas semanas: em vez de comparar, tentar sentir alegria genuína pela conquista da outra pessoa. Quem praticou mais isso relatou mais autoestima nos dias de prática — é um estudo pequeno e curto, então trate como experimento pessoal.',
    praticaGuiada: [
      'Nos próximos sete dias, antes de abrir uma rede, defina em uma frase o que você vai fazer ali.',
      'Ao encontrar um post que dispararia comparação, tente uma frase de celebração sincera pela pessoa — e, se não vier sincera, siga em frente sem se cobrar.',
      'Anote em poucas palavras como se sente ao fechar o app.',
      'No sétimo dia, releia os registros e procure padrões.',
    ],
    leveComVoce: 'Sete dias de observação te dão informação sua — mais útil do que qualquer regra genérica.',
    fontesCientificas: ['CO1', 'CO3'],
  }),
]);

const CP_M3 = modulo('comparacao-m3', 'Sensação de não ser suficiente', [
  sessao({
    id: 'comparacao-m3-s1',
    titulo: 'A frase "não sou suficiente"',
    descricaoCurta: 'Torne o pensamento específico: suficiente para quem, em quê, segundo qual régua?',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      '"Não sou suficiente" é uma frase vaga que se comporta como veredito. Torná-la específica — suficiente para quem, em qual área, segundo qual régua — permite examinar o que está sendo dito, em vez de deixar a frase pairando como uma sentença geral sobre você.',
    praticaGuiada: [
      'Escreva a frase do jeito que ela costuma aparecer na sua cabeça.',
      'Responda três perguntas: suficiente para quem? Em qual área exatamente? Segundo qual regra ou padrão?',
      'Reescreva a frase incorporando essas três respostas.',
    ],
    leveComVoce: 'Uma frase específica é examinável. Uma sentença vaga só pesa.',
    fontesCientificas: ['CO2'],
    avisoSeguranca:
      'O Rose é conteúdo educativo e não substitui tratamento. Se a sensação de não ser suficiente vier acompanhada de tristeza persistente, perda de interesse nas coisas ou desesperança, vale conversar com um profissional de saúde mental.',
  }),
  sessao({
    id: 'comparacao-m3-s2',
    titulo: 'Agir mesmo com o pensamento presente',
    descricaoCurta: 'Observe o pensamento sem precisar vencê-lo antes de seguir em frente.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Há uma alternativa a discutir com o pensamento até derrotá-lo: notar que ele está ali e agir de acordo com o que importa para você mesmo assim. Essa é a lógica de abordagens baseadas em aceitação e valores, que em uma meta-análise de dezenas de ensaios tiveram resultados melhores que lista de espera e comparáveis aos da terapia cognitivo-comportamental em diferentes problemas de saúde.',
    praticaGuiada: [
      'Escreva a versão específica do pensamento que você montou na sessão anterior.',
      'Diga mentalmente: "Estou percebendo o pensamento de que não sou suficiente" — sem tentar convencê-lo do contrário.',
      'Escolha uma ação pequena, coerente com algo que importa para você, para fazer com o pensamento ainda presente.',
      'Faça essa ação e note o que aconteceu com o pensamento enquanto você agia.',
    ],
    reflexao: 'Foi possível agir mesmo sem o pensamento ter ido embora?',
    leveComVoce: 'Você não precisa ganhar a discussão com um pensamento para dar o próximo passo.',
    fontesCientificas: ['CO7'],
  }),
  sessao({
    id: 'comparacao-m3-s3',
    titulo: 'Meu valor tem mais de uma dimensão',
    descricaoCurta: 'Construa um mapa com relações, valores, habilidades, interesses e escolhas.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'A sensação de não ser suficiente costuma vir de medir o valor pessoal por uma régua só: aparência, sucesso, produtividade. Ampliar o mapa — relações, valores, habilidades, interesses, escolhas — lembra que existem outras dimensões, e cada uma delas pode ser apoiada em algo que já aconteceu de verdade.',
    praticaGuiada: [
      'Liste cinco áreas: relações, valores, habilidades, interesses e escolhas que você já fez.',
      'Escreva uma coisa concreta em cada área — algo que aconteceu, não um elogio genérico.',
      'Olhe o mapa completo e note o quanto ele é mais amplo do que a régua única que gerava a sensação de insuficiência.',
    ],
    leveComVoce: 'Você é mais do que a régua que estava usando para se medir.',
    fontesCientificas: ['CO6'],
  }),
]);

const CP_M4 = modulo('comparacao-m4', 'Insegurança e busca por validação', [
  sessao({
    id: 'comparacao-m4-s1',
    titulo: 'O ciclo da confirmação',
    descricaoCurta: 'Identifique o padrão: dúvida, pedido de confirmação, alívio curto, dúvida de volta.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Buscar validação é humano e faz parte de qualquer relação: pedir opinião, querer ser vista, procurar apoio. Nada disso é problema por si só. O que costuma trazer sofrimento é quando o pedido vira repetitivo e rígido — a mesma confirmação, muitas vezes, com alívio cada vez mais curto. Em pessoas em tratamento para ansiedade, esse padrão diminuiu junto com a melhora clínica, o que sugere que ele acompanha o sofrimento em vez de ser um traço fixo.',
    praticaGuiada: [
      'Lembre de um momento recente em que você buscou confirmação sobre algo.',
      'Mapeie o ciclo: qual foi a dúvida inicial, como você buscou confirmação, quanto durou o alívio e se a dúvida voltou.',
      'Observe o padrão sem se cobrar por ele — o objetivo aqui é enxergar, não corrigir.',
    ],
    leveComVoce: 'Buscar apoio é humano. O que vale observar é quando o pedido não sacia mais.',
    fontesCientificas: ['CO4'],
  }),
  sessao({
    id: 'comparacao-m4-s2',
    titulo: 'Validar sem mentir para mim',
    descricaoCurta: 'Reconheça esforço, emoção e intenção sem prometer um resultado.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Dá para se validar internamente sem prometer resultados que não dependem de você. Reconhecer o esforço real, a emoção envolvida e a intenção por trás é uma validação honesta — bem diferente de garantir que "vai dar tudo certo", frase que a sua mente costuma não comprar.',
    praticaGuiada: [
      'Pense em algo que você fez recentemente e gostaria que alguém validasse.',
      'Escreva "Eu me esforcei para..." descrevendo o esforço real.',
      'Escreva "Eu senti..." nomeando a emoção envolvida.',
      'Escreva "Minha intenção era..." reconhecendo a intenção, sem garantir resultado.',
    ],
    leveComVoce: 'Você pode reconhecer o próprio esforço sem prometer um final perfeito.',
    fontesCientificas: ['CO4', 'CO7'],
  }),
  sessao({
    id: 'comparacao-m4-s3',
    titulo: 'Uma pequena decisão minha',
    descricaoCurta: 'Decida algo de baixo risco sem pedir aprovação e observe como foi.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Um experimento pequeno e reversível — decidir algo simples sem consultar ninguém — permite praticar confiar no próprio julgamento num contexto em que errar não custa caro. Isso não é sobre parar de pedir opinião: pedir opinião continua sendo útil e saudável. É sobre lembrar que você também consegue decidir sozinha.',
    praticaGuiada: [
      'Escolha uma decisão pequena e de baixo risco: o que vestir, que caminho fazer, que música ouvir.',
      'Decida sozinha, sem pedir opinião a ninguém e sem checar depois se acertou.',
      'Observe como foi decidir sozinha — não se a decisão foi a "certa", mas como foi a experiência.',
    ],
    leveComVoce: 'Pequenas decisões suas vão construindo confiança no seu próprio julgamento.',
    fontesCientificas: ['CO4', 'CO7'],
  }),
]);

const CP_M5 = modulo('comparacao-m5', 'Autenticidade', [
  sessao({
    id: 'comparacao-m5-s1',
    titulo: 'O que realmente importa para mim',
    descricaoCurta: 'Selecione três valores pessoais e traduza-os em comportamentos.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Valores não são metas: são direções que importam para você, independentemente do resultado. Em um estudo longitudinal com universitários, agir de acordo com os próprios valores e sentimentos apareceu associado a mais satisfação com a vida meses depois. Autenticidade aqui é isso — não é obrigação de expor tudo sobre si para todo mundo.',
    praticaGuiada: [
      'Escolha três valores que importam de verdade para você: honestidade, cuidado, criatividade, conexão, coragem.',
      'Para cada um, escreva um comportamento concreto que o expressa no seu dia a dia.',
      'Guarde essa lista como ponto de referência para decisões futuras.',
    ],
    leveComVoce: 'Valores são uma bússola mais estável do que a aprovação alheia.',
    fontesCientificas: ['CO5', 'CO7'],
  }),
  sessao({
    id: 'comparacao-m5-s2',
    titulo: 'Quem sou e quem tento parecer',
    descricaoCurta: 'Compare escolhas autênticas e escolhas guiadas só por aprovação.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Nem toda escolha é totalmente autêntica: algumas são feitas pensando em como você será vista, e isso é humano. Reconhecer a diferença, sem se culpar, dá clareza sobre o que é seu. Também importa lembrar que ser autêntica não obriga ninguém a se expor: existem contextos em que guardar informações sobre si é proteção legítima, e escolher o que revelar continua sendo parte de agir com os próprios valores.',
    praticaGuiada: [
      'Pense em duas escolhas recentes: uma que você sente que foi genuinamente sua e outra guiada por como seria vista.',
      'Escreva o que diferencia as duas.',
      'Sem se julgar, note que as duas fazem parte de conviver com outras pessoas.',
    ],
    leveComVoce: 'Autenticidade é agir pelos seus valores — não é obrigação de mostrar tudo a todo mundo.',
    fontesCientificas: ['CO5'],
  }),
  sessao({
    id: 'comparacao-m5-s3',
    titulo: 'Um ato mais alinhado',
    descricaoCurta: 'Escolha uma ação pequena coerente com um dos seus valores.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de nomear valores e observar a diferença entre autenticidade e busca por aprovação, vem a parte prática: escolher uma ação pequena, coerente com um valor seu, para os próximos dias. Abordagens de aceitação e valores partem justamente daí — agir na direção do que importa sem esperar a insegurança sumir antes.',
    praticaGuiada: [
      'Releia os três valores que você escreveu.',
      'Escolha um deles e pense numa ação pequena e concreta que o expresse.',
      'Defina quando essa ação vai acontecer e o que pode atrapalhar.',
    ],
    leveComVoce: 'Um pequeno ato alinhado com seus valores pesa mais do que muitos atos feitos por aprovação.',
    fontesCientificas: ['CO7', 'CO5'],
  }),
]);

const CP_M6 = modulo('comparacao-m6', 'Reconhecimento das próprias qualidades', [
  sessao({
    id: 'comparacao-m6-s1',
    titulo: 'Qualidades com evidências',
    descricaoCurta: 'Nomeie três qualidades e uma situação concreta que sustente cada uma.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Reconhecer qualidades próprias funciona melhor quando ancorado em situações reais, não em afirmações grandiosas. Um exercício clássico de identificar as próprias forças e usá-las de um jeito novo apareceu, num ensaio pela internet, entre os que aumentaram bem-estar de forma mais duradoura. Aqui a regra é simples: só entra na lista o que tiver um exemplo concreto por trás.',
    praticaGuiada: [
      'Escolha três qualidades suas, e podem ser pequenas: paciência, curiosidade, atenção com os outros.',
      'Para cada uma, lembre de uma situação real e específica em que ela apareceu — data, lugar, o que você fez.',
      'Se não vier um exemplo concreto para alguma qualidade, troque essa qualidade por outra que tenha.',
      'Escreva as três qualidades junto com suas respectivas evidências.',
    ],
    leveComVoce: 'Uma qualidade apoiada num exemplo real é bem mais fácil de acreditar.',
    fontesCientificas: ['CO6'],
  }),
  sessao({
    id: 'comparacao-m6-s2',
    titulo: 'Comparar com o meu próprio caminho',
    descricaoCurta: 'Observe aprendizado e esforço próprios em vez de ranking com os outros.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Já que comparar não vai deixar de acontecer, uma alternativa é mudar o ponto de referência: comparar você agora com você antes. Essa é uma régua que só você tem informação suficiente para usar de forma justa, porque só você conhece o caminho inteiro — o esforço, o contexto, o que estava acontecendo em volta.',
    praticaGuiada: [
      'Pense numa habilidade ou área em que você evoluiu, mesmo que pouco, no último ano.',
      'Escreva o que mudou, comparando só você com você mesma antes.',
      'Reconheça o esforço envolvido nesse caminho, independentemente do resultado final.',
    ],
    leveComVoce: 'A comparação mais justa disponível é entre você hoje e você antes.',
    fontesCientificas: ['CO6', 'CO1'],
  }),
  sessao({
    id: 'comparacao-m6-s3',
    titulo: 'Plano para quando a comparação voltar',
    descricaoCurta: 'Registre gatilhos, sinais, frase de interrupção, ação e pessoa de apoio.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Esta última sessão reúne a jornada num plano curto para os momentos em que a comparação voltar — e ela vai voltar, porque comparar faz parte de conviver com outras pessoas. Ter um plano pronto é mais confiável do que improvisar justamente quando você está mais mobilizada.',
    praticaGuiada: [
      'Anote um ou dois gatilhos comuns de comparação para você.',
      'Anote um sinal no corpo ou na mente que costuma indicar que a comparação começou.',
      'Escolha uma frase curta de interrupção, por exemplo: "isso é comparação, e eu posso escolher outra coisa agora".',
      'Escolha uma ação para fazer em seguida, ligada a algo que importa para você.',
      'Se fizer sentido, anote uma pessoa que você poderia procurar nos momentos mais difíceis.',
    ],
    reflexao: 'Qual parte desse plano parece mais fácil de lembrar na hora?',
    leveComVoce: 'Agora você tem um plano seu — e a comparação vai voltar, e está tudo bem.',
    fontesCientificas: ['CO1', 'CO7'],
  }),
]);

const JORNADA_COMPARACAO: Jornada = {
  id: 'comparacao',
  slug: 'comparacao',
  titulo: 'Comparação',
  descricaoCurta: 'Reduza o peso da comparação social e fortaleça o reconhecimento de si mesma.',
  corCartao: 'lilas',
  modulos: [CP_M1, CP_M2, CP_M3, CP_M4, CP_M5, CP_M6],
};

// ============================================================
// JORNADA 4 — ALIMENTAÇÃO EMOCIONAL (7 módulos, 20 sessões)
// ============================================================

const AE_M1 = modulo('alimentacao-emocional-m1', 'Fome física e fome emocional', [
  sessao({
    id: 'alimentacao-emocional-m1-s1',
    titulo: 'Fome não é uma prova que você precisa apresentar',
    descricaoCurta: 'Entenda que os sinais de fome variam e que corpo e emoção podem falar juntos.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Fome não é um evento único e uniforme: os sinais mudam de pessoa para pessoa e de dia para dia. Além disso, fome do corpo e necessidade emocional podem aparecer ao mesmo tempo, e uma não invalida a outra. Você não precisa provar qual delas é "a verdadeira" antes de se permitir comer. Programas estruturados de várias semanas estiveram associados a mais atenção aos sinais internos do corpo — não é algo que se resolve numa sessão.',
    praticaGuiada: [
      'Lembre da última vez em que sentiu fome.',
      'Anote quais sinais do corpo você percebeu, se percebeu algum, e como eles apareceram.',
      'Reconheça que não existe uma única forma certa de sentir fome.',
    ],
    leveComVoce: 'Você não precisa justificar a sua fome para ter permissão de atendê-la.',
    fontesCientificas: ['AL2', 'AL3'],
  }),
  sessao({
    id: 'alimentacao-emocional-m1-s2',
    titulo: 'Três pistas antes de comer',
    descricaoCurta: 'Observe sinais do corpo, urgência emocional e contexto, sem classificar nada.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Antes de comer, observar três pistas — o que o corpo sinaliza, se existe urgência emocional e qual é o contexto — ajuda a entender o momento presente sem precisar rotular a fome como certa ou errada. Esta prática é só de observação: ela nunca deve ser usada para adiar uma refeição.',
    praticaGuiada: [
      'Antes de comer, agora ou na próxima refeição, pare por um instante.',
      'Observe: o que o meu corpo está sinalizando?',
      'Observe: existe uma urgência emocional forte agora?',
      'Observe: qual é o contexto — horário, quanto tempo faz desde a última refeição, o que estou sentindo?',
      'Sem julgar as respostas, reconheça as três pistas juntas e siga para a refeição.',
    ],
    leveComVoce: 'Observar as pistas do momento é mais útil do que tentar classificar a fome.',
    fontesCientificas: ['AL3', 'AL2'],
  }),
  sessao({
    id: 'alimentacao-emocional-m1-s3',
    titulo: 'Check-in antes, durante e depois',
    descricaoCurta: 'Note fome, sabor, conforto e satisfação — sem escalas obrigatórias.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Um check-in simples antes, durante e depois de comer ajuda a reaproximar você da experiência de comer, prestando atenção em sabor, conforto e satisfação. Em ensaios com práticas de alimentação com atenção plena mantidas por semanas, houve melhora na percepção dos sinais de fome; aqui, o objetivo é bem mais modesto: reparar no que já está acontecendo.',
    praticaGuiada: [
      'Antes de comer, note em poucas palavras como você está se sentindo.',
      'Durante a refeição, note o sabor e a sensação de conforto, sem pressa.',
      'Depois de comer, note a satisfação e qualquer emoção presente.',
      'Não use números nem metas: palavras descritivas bastam.',
    ],
    leveComVoce: 'Prestar atenção na experiência de comer é diferente de vigiar a si mesma.',
    fontesCientificas: ['AL3'],
  }),
]);

const AE_M2 = modulo('alimentacao-emocional-m2', 'Emoções relacionadas à alimentação', [
  sessao({
    id: 'alimentacao-emocional-m2-s1',
    titulo: 'Comer por emoção não é falha de caráter',
    descricaoCurta: 'Normalize a experiência sem banalizar quando ela é recorrente e dolorosa.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comer em resposta a uma emoção é uma experiência humana comum, não um sinal de fraqueza. Ao mesmo tempo, vale olhar com cuidado quando isso se torna frequente e vem acompanhado de sofrimento. Registros feitos no dia a dia mostram que o estado emocional tende a piorar antes de episódios difíceis com a comida; o que acontece depois varia bastante entre as pessoas e entre os estudos.',
    praticaGuiada: [
      'Lembre de uma vez em que você comeu por causa de uma emoção, e não por fome do corpo.',
      'Reconheça sem julgamento: "isso é uma experiência humana comum".',
      'Se isso acontece com frequência e traz sofrimento, anote isso e trate como um sinal de procurar um profissional de saúde — não como algo a resolver sozinha ao longo da jornada.',
    ],
    leveComVoce: 'Comer por emoção às vezes acontece — isso não diz nada sobre quem você é.',
    fontesCientificas: ['AL4'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
  sessao({
    id: 'alimentacao-emocional-m2-s2',
    titulo: 'Dar nome ao que sinto',
    descricaoCurta: 'Identifique a emoção, a necessidade por trás dela e o que veio antes.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Antes de decidir o que fazer com uma vontade de comer ligada à emoção, ajuda dar um passo atrás: identificar qual emoção está presente, que necessidade ela pode estar sinalizando e o que aconteceu antes. Colocar a emoção em palavras esteve associado, em estudo de laboratório, a uma reação emocional menos intensa — menos intensa, não ausente.',
    praticaGuiada: [
      'Quando notar uma vontade de comer que parece ligada a uma emoção, pare por um momento.',
      'Nomeie a emoção presente: tédio, ansiedade, tristeza, solidão, sobrecarga.',
      'Pergunte-se que necessidade essa emoção pode estar sinalizando: descanso, companhia, conforto, distração.',
      'Anote a situação que veio logo antes dessa emoção.',
    ],
    leveComVoce: 'Nomear a emoção e a necessidade por trás dela abre mais opções do que agir no automático.',
    fontesCientificas: ['AL4', 'AC6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m2-s3',
    titulo: 'Somar opções, não proibir',
    descricaoCurta: 'Monte um menu de apoio que pode existir ao lado da escolha de comer.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'A proposta aqui não é proibir comer por emoção. É acrescentar outras formas de apoio ao seu repertório, para que existam mais caminhos disponíveis quando a emoção aparecer — sem tirar a comida da mesa como possibilidade legítima. Práticas de atenção plena estiveram associadas, numa revisão, a menos episódios de comer em resposta a emoções em quem já vivia esse padrão.',
    praticaGuiada: [
      'Pense em três formas de apoio emocional que não envolvem comida: ligar para alguém, escrever, caminhar, ouvir música, descansar.',
      'Anote as três como um menu de apoio — não para substituir comer obrigatoriamente, mas para ter mais escolhas à mão.',
      'Guarde esse menu onde você possa consultar quando quiser.',
    ],
    leveComVoce: 'Ter mais opções disponíveis é diferente de proibir uma delas.',
    fontesCientificas: ['AL6', 'AL4'],
  }),
]);

const AE_M3 = modulo('alimentacao-emocional-m3', 'Culpa após comer', [
  sessao({
    id: 'alimentacao-emocional-m3-s1',
    titulo: 'Comida não define caráter',
    descricaoCurta: 'Retire a linguagem moral das suas frases sobre alimentação.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'É comum descrever escolhas alimentares com palavras de julgamento moral, como se comer fosse uma questão de mérito. Essa linguagem transforma uma refeição em veredito sobre quem você é. Programas que trabalham justamente o questionamento desses julgamentos estiveram associados, em ensaios brasileiros, a mais apreciação corporal e menos comportamento alimentar desregrado.',
    praticaGuiada: [
      'Lembre de uma frase que você já disse sobre si mesma depois de comer algo.',
      'Reescreva essa frase de forma neutra, descrevendo só o fato: "eu comi tal coisa".',
      'Leia as duas versões em sequência e note qual delas soa mais dura com você.',
    ],
    leveComVoce: 'O que você come não é um veredito sobre quem você é.',
    fontesCientificas: ['AL1'],
  }),
  sessao({
    id: 'alimentacao-emocional-m3-s2',
    titulo: 'Descrever sem se atacar',
    descricaoCurta: 'Reescreva "estraguei tudo" como algo factual e temporário.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Frases como "estraguei tudo" são absolutas e permanentes, mesmo quando descrevem um único momento. Reescrevê-las de forma factual e delimitada no tempo diminui a carga emocional que elas trazem — e reduz a chance de a culpa virar combustível para tentar consertar alguma coisa depois.',
    praticaGuiada: [
      'Pegue uma frase de autocrítica recente sobre comer.',
      'Reescreva de forma factual, descrevendo o que exatamente aconteceu, sem generalizar.',
      'Acrescente um elemento temporário: "isso foi um momento, não define o meu dia".',
    ],
    leveComVoce: 'Um momento específico não precisa virar sentença sobre o dia inteiro.',
    fontesCientificas: ['AL1', 'AL4'],
  }),
  sessao({
    id: 'alimentacao-emocional-m3-s3',
    titulo: 'Cuidado depois de comer, sem compensação',
    descricaoCurta: 'Planeje seguir cuidando do corpo normalmente, sem punição.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Quando a culpa aparece depois de uma refeição, é comum surgir a vontade de compensar o que foi comido. Diretrizes clínicas tratam comportamentos de compensação como um sinal que pede avaliação profissional, e não como uma estratégia. O caminho de cuidado depois de comer é o mesmo cuidado de sempre: continuar se alimentando ao longo do dia e seguir a rotina.',
    praticaGuiada: [
      'Lembre de um momento recente em que sentiu vontade de compensar algo que comeu.',
      'Reconheça essa vontade sem agir automaticamente sobre ela — nomear já é um passo.',
      'Escolha uma forma de cuidado neutro no lugar: seguir se alimentando normalmente ao longo do dia, descansar, manter a sua rotina.',
      'Se a vontade de compensar for forte ou frequente, anote isso e leve para um profissional de saúde.',
    ],
    leveComVoce: 'Depois de comer, o que o seu corpo pede é o cuidado de sempre — não uma correção.',
    fontesCientificas: ['AL7', 'AL5'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
]);

const AE_M4 = modulo('alimentacao-emocional-m4', 'Restrições alimentares', [
  sessao({
    id: 'alimentacao-emocional-m4-s1',
    titulo: 'O ciclo de restrição, urgência e culpa',
    descricaoCurta: 'Entenda como regras muito rígidas podem alimentar a sensação de perda de controle.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Regras alimentares muito rígidas podem, para muitas pessoas, aumentar a preocupação com comida e a sensação de perda de controle quando a regra é quebrada, formando um ciclo de restrição, urgência e culpa. Num estudo que acompanhou adolescentes por cinco anos, passar longos períodos sem comer de propósito foi a forma de restrição mais associada ao surgimento posterior de episódios de descontrole. É um estudo observacional, então indica risco associado, não causa isolada — e isso é motivo para conversar com um profissional, não para se cobrar.',
    praticaGuiada: [
      'Pense se existe alguma regra alimentar rígida que você segue ou tenta seguir.',
      'Reflita: essa regra aumenta ou diminui a sua preocupação com comida no geral?',
      'Sem julgar, observe se existe um padrão de regra, urgência e culpa se repetindo.',
    ],
    leveComVoce: 'Perceber um padrão não significa que você errou — é informação valiosa.',
    fontesCientificas: ['AL5', 'AL7'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
  sessao({
    id: 'alimentacao-emocional-m4-s2',
    titulo: 'As regras invisíveis da comida',
    descricaoCurta: 'Identifique "posso", "não posso" e "mereço" nos seus próprios pensamentos.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Muitas regras alimentares são invisíveis: não estão escritas em lugar nenhum, mas moldam decisões o tempo todo, através de palavras como "posso", "não posso" e "mereço". Trazer essas regras para o consciente é o primeiro passo para poder questioná-las, e questionar ativamente esse tipo de regra é o mecanismo central dos programas de dissonância testados no Brasil.',
    praticaGuiada: [
      'Ao longo do dia, ou pensando num dia comum seu, note quando usa mentalmente palavras como "posso", "não posso" e "mereço" em relação à comida.',
      'Anote uma ou duas dessas regras invisíveis que você identificou.',
      'Sem mudar nada ainda, apenas reconheça que elas existem e de onde parecem ter vindo.',
    ],
    leveComVoce: 'Uma regra que você nem sabia que seguia já perde força ao ser nomeada.',
    fontesCientificas: ['AL1', 'AL2'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
  sessao({
    id: 'alimentacao-emocional-m4-s3',
    titulo: 'Flexibilizar com segurança e sem pressa',
    descricaoCurta: 'Escolha uma regra pequena para afrouxar, com apoio quando necessário.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Afrouxar uma regra alimentar rígida é algo que se faz aos poucos, começando pelo que é pequeno e de baixo risco. O objetivo não é abandonar todo cuidado com a alimentação, e sim recuperar flexibilidade onde a rigidez está causando sofrimento. Isso não substitui acompanhamento: quando existe uma restrição por indicação médica ou um quadro alimentar em tratamento, essa mudança precisa ser conduzida por um profissional.',
    praticaGuiada: [
      'Escolha uma das regras invisíveis que você identificou, de preferência a mais leve, não a mais difícil.',
      'Confirme que ela não é uma orientação médica ou nutricional que você recebeu de um profissional. Se for, mantenha e converse com quem te acompanha.',
      'Pense num jeito pequeno de flexibilizar essa regra, no seu ritmo.',
      'Anote como você imagina se sentir experimentando isso — sem se cobrar para fazer imediatamente.',
    ],
    leveComVoce: 'Afrouxar uma regra pequena, no seu tempo, já é um passo real.',
    fontesCientificas: ['AL2', 'AL7'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
]);

const AE_M5 = modulo('alimentacao-emocional-m5', 'Compulsão alimentar', [
  sessao({
    id: 'alimentacao-emocional-m5-s1',
    titulo: 'Quando existe sensação de perda de controle',
    descricaoCurta: 'Reconheça sinais gerais, sem se aplicar um diagnóstico.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Algumas pessoas vivem episódios com sensação de perda de controle ao comer: comer rápido, além do confortável, com a impressão de não conseguir parar. O Rose não faz diagnóstico e esta sessão não é um teste. Ela só ajuda a reconhecer, em termos gerais, se essa experiência está presente na sua vida — e diretrizes clínicas são claras em recomendar avaliação especializada precoce quando ela está.',
    praticaGuiada: [
      'Sem tentar se avaliar com rigor clínico, pense se você já teve a sensação de comer sem conseguir parar, mesmo querendo.',
      'Se sim, reconheça isso sem julgamento, como uma experiência que merece cuidado.',
      'Anote com que frequência isso costuma acontecer e o quanto incomoda, em poucas palavras.',
      'Leve essas anotações para a próxima sessão, que trata de quando e como procurar apoio.',
    ],
    leveComVoce: 'Reconhecer essa sensação não é um rótulo — é um convite a se cuidar melhor.',
    fontesCientificas: ['AL7', 'AL4'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
  sessao({
    id: 'alimentacao-emocional-m5-s2',
    titulo: 'Uma pausa para entender o impulso',
    descricaoCurta: 'Observe a onda de urgência — nunca para adiar comida quando há fome.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Diante de um impulso muito forte de comer, uma pausa breve pode dar espaço para observar a urgência antes de agir. Existe um limite importante nesta prática: ela não serve para adiar comida quando o corpo tem fome. Usar pausas como forma de restrição tende a alimentar exatamente o ciclo que esta jornada tenta aliviar.',
    praticaGuiada: [
      'Se notar um impulso forte que não parece ligado à fome do corpo, pare por um momento.',
      'Respire e observe a urgência sem julgá-la, como uma onda que sobe e depois desce.',
      'Escolha o que fazer em seguida com mais espaço — e isso pode perfeitamente incluir comer.',
      'Se em qualquer momento perceber fome do corpo, coma: esta pausa nunca deve atrasar isso.',
    ],
    leveComVoce: 'Esta pausa é sobre criar espaço, nunca sobre se privar de comer.',
    fontesCientificas: ['AL6', 'AL4'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
  sessao({
    id: 'alimentacao-emocional-m5-s3',
    titulo: 'Quando procurar ajuda profissional',
    descricaoCurta: 'Saiba reconhecer os sinais que pedem avaliação especializada.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Algumas experiências pedem avaliação profissional em vez de conteúdo educativo: episódios repetidos com perda de controle, sofrimento importante em torno da comida, segredo, qualquer tentativa de compensar o que foi comido, tontura ou desmaio. Diretrizes do NICE e da Associação Americana de Psiquiatria recomendam avaliação especializada precoce nesses casos. Procurar ajuda aqui é cuidado, não fracasso.',
    praticaGuiada: [
      'Leia com calma a lista de sinais: episódios frequentes com perda de controle, sofrimento intenso depois de comer, esconder o que ou o quanto come, qualquer comportamento para compensar uma refeição, sinais físicos como tontura ou desmaio.',
      'Reconheça, sem julgamento, se algum desses sinais faz parte da sua experiência.',
      'Se fizer, escreva o nome de um profissional ou serviço que você poderia procurar nas próximas semanas.',
      'Se você tem menos de 18 anos, escolha também uma pessoa adulta de confiança para contar.',
    ],
    leveComVoce: 'Pedir ajuda profissional é um dos cuidados mais fortes que existem.',
    fontesCientificas: ['AL7', 'AL8'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
]);

const AE_M6 = modulo('alimentacao-emocional-m6', 'Relação mais consciente com a comida', [
  sessao({
    id: 'alimentacao-emocional-m6-s1',
    titulo: 'Uma experiência sensorial de poucos instantes',
    descricaoCurta: 'Prática opcional: observe cheiro, textura e sabor de uma pequena parte da refeição.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Comer com atenção plena, mesmo que apenas em uma pequena parte da refeição, traz mais presença para a experiência de comer. É opcional e não precisa ser feito em toda refeição. Nos estudos, esse tipo de prática apareceu sustentada por semanas de encontros; aqui a proposta é bem menor e não exige perfeição nenhuma.',
    praticaGuiada: [
      'Escolha um pequeno pedaço ou uma porção do que você vai comer.',
      'Antes de levar à boca, observe o cheiro e a aparência, sem pressa.',
      'Ao comer, note textura e sabor com atenção por alguns instantes.',
      'Depois disso, siga a refeição no seu ritmo normal, sem precisar manter essa atenção o tempo todo.',
    ],
    leveComVoce: 'Alguns instantes de atenção já contam — não precisa ser a refeição inteira.',
    fontesCientificas: ['AL3', 'AL6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m6-s2',
    titulo: 'Satisfação também importa',
    descricaoCurta: 'Observe prazer, conforto e saciedade sem procurar um ponto perfeito.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Satisfação — o prazer e o conforto de uma refeição — é parte legítima de comer bem, e não um luxo dispensável. Prestar atenção nela costuma andar junto com uma relação mais orientada pelos sinais do próprio corpo, que é o que os programas testados no Brasil buscam desenvolver. Aqui não existe ponto exato para acertar.',
    praticaGuiada: [
      'Na próxima refeição, note se ela está sendo satisfatória: o sabor, a companhia, o conforto.',
      'Perceba a saciedade quando ela aparecer, sem cronometrar nem tentar acertar um ponto exato.',
      'Reconheça que sentir prazer numa refeição também é uma forma de cuidado.',
    ],
    leveComVoce: 'Satisfação faz parte de uma boa relação com a comida — não é um extra.',
    fontesCientificas: ['AL3', 'AL2'],
  }),
  sessao({
    id: 'alimentacao-emocional-m6-s3',
    titulo: 'Escolha consciente não é escolha perfeita',
    descricaoCurta: 'Decida com informação e flexibilidade, sem julgamento depois.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Comer de forma mais consciente não significa acertar sempre. Significa decidir com alguma informação — fome, contexto, vontade — e com flexibilidade, sem carregar julgamento sobre o resultado. Nenhuma escolha isolada precisa ser revisitada depois como se fosse um erro a ser corrigido.',
    praticaGuiada: [
      'Na sua próxima decisão sobre comida, pare um instante antes de decidir.',
      'Considere três coisas: fome, contexto e vontade — sem regra fixa sobre qual delas deve vencer.',
      'Tome a decisão e siga em frente, sem revisitar depois com julgamento.',
    ],
    leveComVoce: 'Consciente não é sinônimo de perfeita — é sinônimo de presente.',
    fontesCientificas: ['AL3', 'AL1'],
  }),
]);

const AE_M7 = modulo('alimentacao-emocional-m7', 'Gatilhos e autocuidado sem punição', [
  sessao({
    id: 'alimentacao-emocional-m7-s1',
    titulo: 'Registro do pensamento automático',
    descricaoCurta: 'Cinco campos: situação, reação do corpo, emoção, pensamento e alternativa.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Um registro de pensamento automático é uma ferramenta simples para enxergar o encadeamento entre situação, corpo, emoção e pensamento — e para ensaiar uma leitura alternativa. São cinco campos, nesta ordem, e nada além disso: nenhuma classificação de "distorção", nenhuma avaliação do que você fez depois. Nomear o que se sente esteve associado, em estudo de laboratório, a uma reação emocional menos intensa.',
    praticaGuiada: [
      'Campo 1 — situação concreta: descreva o que aconteceu, com hora e lugar, sem interpretar.',
      'Campo 2 — reação física ou corporal: o que você sentiu no corpo naquele momento.',
      'Campo 3 — sentimento ou emoção: dê um nome simples ao que sentiu.',
      'Campo 4 — pensamento automático negativo: a frase exata que passou pela sua cabeça.',
      'Campo 5 — pensamento racional alternativo: uma leitura possível e realista da mesma situação.',
    ],
    reflexao: 'O que mudou entre o campo 4 e o campo 5?',
    leveComVoce: 'Ver o encadeamento inteiro é diferente de julgar o momento final dele.',
    fontesCientificas: ['AC6', 'AL4'],
  }),
  sessao({
    id: 'alimentacao-emocional-m7-s2',
    titulo: 'Meu plano de apoio',
    descricaoCurta: 'Reúna sinais de alerta, ações seguras, contatos e critérios para buscar ajuda.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Esta sessão final reúne a jornada num plano de apoio: sinais de alerta para reconhecer cedo, ações seguras para o momento, pessoas de apoio e critérios para procurar ajuda profissional. Decidir isso agora, com calma, é mais confiável do que decidir no meio de um momento difícil. O plano é um apoio pessoal, não um substituto de tratamento.',
    praticaGuiada: [
      'Anote um ou dois sinais de alerta que costumam aparecer antes de um momento difícil com a comida.',
      'Anote uma ou duas ações seguras que ajudam nesses momentos: pausar, respirar, ligar para alguém, sair da situação.',
      'Anote o nome de uma pessoa de apoio, se existir, e como você a contataria.',
      'Anote os critérios que, para você, indicariam a hora de procurar ajuda profissional.',
      'Guarde o plano em algum lugar acessível e revise sempre que quiser.',
    ],
    reflexao: 'Como foi construir esse plano para si mesma?',
    leveComVoce: 'Pedir ajuda, se um dia você precisar, é um dos passos mais corajosos que existem.',
    fontesCientificas: ['AL7', 'AL8'],
    avisoSeguranca: AVISO_ALIMENTACAO,
  }),
]);

const JORNADA_ALIMENTACAO_EMOCIONAL: Jornada = {
  id: 'alimentacao-emocional',
  slug: 'alimentacao-emocional',
  titulo: 'Alimentação emocional',
  descricaoCurta: 'Construa uma relação mais consciente e sem punição com a comida.',
  corCartao: 'salvia',
  modulos: [AE_M1, AE_M2, AE_M3, AE_M4, AE_M5, AE_M6, AE_M7],
};

// ============================================================

export const JORNADAS: Jornada[] = [
  JORNADA_IMAGEM_CORPORAL,
  JORNADA_AUTOCOMPAIXAO,
  JORNADA_COMPARACAO,
  JORNADA_ALIMENTACAO_EMOCIONAL,
];

export function listarJornadas(): Jornada[] {
  return JORNADAS;
}

export function buscarJornadaPorSlug(slug: string): Jornada | undefined {
  return JORNADAS.find((j) => j.slug === slug);
}

export function listarSessoesEmOrdem(jornada: Jornada): Sessao[] {
  return jornada.modulos.flatMap((m) => m.sessoes);
}

export function buscarSessaoPorId(
  jornadaSlug: string,
  sessaoId: string
): { sessao: Sessao; modulo: Modulo } | undefined {
  const jornada = buscarJornadaPorSlug(jornadaSlug);
  if (!jornada) return undefined;
  for (const modulo of jornada.modulos) {
    const sessao = modulo.sessoes.find((s) => s.id === sessaoId);
    if (sessao) return { sessao, modulo };
  }
  return undefined;
}

export function contarModulos(jornada: Jornada): number {
  return jornada.modulos.length;
}

export function contarSessoes(jornada: Jornada): number {
  return jornada.modulos.reduce((total, m) => total + m.sessoes.length, 0);
}
