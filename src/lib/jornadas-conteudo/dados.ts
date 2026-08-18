// Conteúdo real das 4 jornadas (26 módulos, 83 sessões). Vive em código, não
// no banco — mesmo padrão de `src/lib/praticas-conteudo/dados.ts`. Só o
// PROGRESSO de cada usuária é persistido (ver `./progresso.ts`); os
// componentes calculam o estado de cada sessão (disponível/em_andamento/
// concluída/bloqueada) a partir desse progresso, nunca lendo `concluida`
// daqui — este arquivo não tem, de propósito, nenhum campo de progresso.
//
// Todo texto é original, escrito para o Rose — não é cópia dos artigos
// científicos referenciados (ver `./referencias.ts`). Nenhuma sessão promete
// cura, emagrecimento ou resultado garantido; nenhuma menciona contagem de
// calorias, peso, IMC, jejum ou divisão "comida boa/comida ruim" — ver
// regras de segurança psicológica no plano desta rodada.
//
// revisaoStatus é 'pendente' em TODAS as sessões desta rodada: nada aqui
// passou por revisão humana real da psicóloga responsável. Não preencher
// revisadoPor/revisadoEm sem essa revisão de verdade acontecer.
import type { Jornada, Modulo, Sessao } from './tipos';

function modulo(id: string, titulo: string, sessoes: Sessao[]): Modulo {
  return { id, titulo, sessoes };
}

function sessao(dados: Omit<Sessao, 'revisaoStatus'>): Sessao {
  return { ...dados, revisaoStatus: 'pendente' };
}

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
      'Imagem corporal é a forma como você pensa, sente e se comporta em relação ao seu corpo — não é uma medida objetiva do corpo em si. Duas pessoas com corpos parecidos podem ter imagens corporais completamente diferentes, porque essa imagem é feita de pensamentos, emoções, memórias e comparações, não só de espelho. Perceber essa diferença é o primeiro passo desta jornada: você não está aqui para mudar seu corpo, está aqui para entender melhor a relação que tem com ele.',
    praticaGuiada: [
      'Pense numa situação recente em que reparou no seu corpo — pode ter sido ao se vestir, num reflexo, numa foto.',
      'Sem tentar corrigir ou melhorar nada, anote: o que você pensou, o que sentiu no corpo e na emoção, e o que fez em seguida.',
      'Releia o que escreveu como quem observa, não como quem julga — só está descrevendo um momento, não avaliando se ele foi "certo".',
    ],
    reflexao: 'O que você percebeu ao separar "o que aconteceu" de "o que você sentiu"?',
    leveComVoce:
      'Você pode observar um pensamento sobre o corpo sem precisar consertá-lo na hora. Só perceber já é um começo.',
    fontesCientificas: ['E1', 'E3'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s2',
    titulo: 'O que o meu corpo torna possível',
    descricaoCurta: 'Volte a atenção para tudo que seu corpo faz por você todos os dias.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Boa parte do sofrimento com a imagem corporal vem de olhar só para a aparência. Existe outro caminho: notar a funcionalidade — tudo que o corpo permite fazer, sentir e viver. Isso não é sobre forçar gratidão ou fingir que está tudo bem; é sobre abrir espaço para uma parte do corpo que normalmente passa despercebida.',
    praticaGuiada: [
      'Pense nas últimas 24 horas e liste ações do seu corpo: andar, respirar fundo, abraçar alguém, sentir o gosto de uma comida, descansar.',
      'Escolha três dessas ações e escreva uma frase curta sobre cada uma — o que ela permitiu que você vivesse.',
      'Não é preciso sentir gratidão para fazer este exercício. Só observar já conta.',
    ],
    reflexao: 'Existe alguma função do seu corpo que você nunca tinha parado para notar?',
    leveComVoce: 'Seu corpo faz muito mais do que aparece no espelho — e isso também é real.',
    fontesCientificas: ['E3'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s3',
    titulo: 'Perceber sem avaliar',
    descricaoCurta: 'Pratique notar sensações do corpo sem rotular como bom ou ruim.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Boa parte do desconforto com o corpo vem de avaliar constantemente — "bonito", "feio", "certo", "errado". Existe uma forma diferente de prestar atenção: descrever sem julgar. Esse tipo de percepção neutra é uma habilidade, e como toda habilidade, melhora com prática.',
    praticaGuiada: [
      'Sente-se confortavelmente e feche os olhos, se quiser.',
      'Perceba o contato do corpo com a cadeira ou o chão — descreva mentalmente: firme, macio, quente, frio.',
      'Perceba a temperatura da pele e o ritmo da respiração, sem tentar mudar nada, só descrevendo o que está aí.',
      'Se surgir um julgamento ("isso está feio", "isso está errado"), note que é um pensamento passando, e volte para a descrição neutra.',
    ],
    leveComVoce: 'Descrever é diferente de avaliar — e essa diferença pode aliviar bastante.',
    fontesCientificas: ['E3'],
  }),
  sessao({
    id: 'imagem-corporal-m1-s4',
    titulo: 'Um cuidado que não depende da aparência',
    descricaoCurta: 'Escolha uma ação de cuidado que faça sentido além de qualquer resultado estético.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Muito cuidado com o corpo hoje em dia é medido pelo resultado que promete gerar na aparência. Esta sessão propõe o oposto: escolher uma ação de cuidado — conforto, proteção, descanso ou saúde — que valeria a pena mesmo que não mudasse nada visível.',
    praticaGuiada: [
      'Pense em quatro áreas: conforto, proteção, descanso, saúde.',
      'Escolha uma ação simples em uma delas — por exemplo, usar uma roupa confortável, proteger a pele do sol, dormir um pouco mais cedo, beber água.',
      'Anote quando e como você vai fazer isso ainda esta semana.',
      'Ao realizar a ação, note que ela vale por si só, não pelo que "corrige" na aparência.',
    ],
    reflexao: 'Como foi escolher um cuidado sem pensar em como ele vai te fazer parecer?',
    leveComVoce: 'Cuidar do corpo não precisa ter como objetivo mudar como ele parece.',
    fontesCientificas: ['E3', 'E1'],
  }),
]);

const IC_M2 = modulo('imagem-corporal-m2', 'Comparação da aparência', [
  sessao({
    id: 'imagem-corporal-m2-s1',
    titulo: 'Quando a comparação aparece',
    descricaoCurta: 'Mapeie os momentos em que você mais se compara com outros corpos.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comparar a própria aparência com a de outras pessoas costuma ser automático — acontece antes mesmo de você decidir. Não é sinal de fraqueza nem de vaidade; é um hábito mental comum. O primeiro passo para lidar com ele é simplesmente mapear onde e quando ele aparece.',
    praticaGuiada: [
      'Pense nos últimos dias e identifique um ou dois momentos em que se comparou com a aparência de alguém.',
      'Para cada um, anote: onde estava, com quem (ou o quê — pode ser uma foto, um vídeo), e o que disparou a comparação.',
      'Não julgue os momentos que encontrar — só mapeie, como quem desenha um mapa do próprio comportamento.',
    ],
    reflexao: 'Existe um padrão nos lugares ou situações em que a comparação aparece mais?',
    leveComVoce: 'Mapear é diferente de combater. Você só está começando a enxergar o padrão.',
    fontesCientificas: ['E4', 'E1'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s2',
    titulo: 'De quem é essa régua?',
    descricaoCurta: 'Identifique de onde vêm os padrões que você usa para se comparar.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Quando comparamos nossa aparência, geralmente usamos uma "régua" — um padrão de referência. Essa régua não nasceu com você: ela vem de família, cultura, publicidade, redes sociais. Reconhecer a origem da régua ajuda a entender que ela não é uma verdade universal, é uma construção.',
    praticaGuiada: [
      'Pense num padrão de aparência que você costuma usar como referência (um tipo de corpo, uma característica específica).',
      'Tente rastrear de onde esse padrão veio: uma frase de infância, uma revista, uma conta que você segue, um comentário familiar.',
      'Escreva uma frase reconhecendo essa origem — por exemplo: "Esse padrão vem de X, não é uma regra que eu escolhi."',
    ],
    leveComVoce: 'Uma régua que veio de fora não precisa continuar medindo sua vida.',
    fontesCientificas: ['E4'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s3',
    titulo: 'Da hierarquia para a diversidade',
    descricaoCurta: 'Pratique observar diferenças entre corpos sem colocá-los em ordem.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Comparar frequentemente vem junto de hierarquizar — colocar corpos numa escala do "melhor" ao "pior". Esta prática convida a um movimento diferente: observar diferenças como diferenças, não como ranking.',
    praticaGuiada: [
      'Pense em duas ou três pessoas com corpos visivelmente diferentes entre si (podem ser pessoas reais ou uma lembrança geral).',
      'Para cada uma, descreva uma característica do corpo sem usar palavras de valor ("melhor", "pior", "mais bonito") — só descrição.',
      'Note como é diferente descrever sem ranquear — pode parecer estranho no início, e isso é esperado.',
    ],
    leveComVoce: 'Diferença não é hierarquia. São só formas diferentes de existir.',
    fontesCientificas: ['E4'],
  }),
  sessao({
    id: 'imagem-corporal-m2-s4',
    titulo: 'Interrompendo o ciclo',
    descricaoCurta: 'Crie uma sequência pessoal para quando a comparação aparecer de novo.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de mapear quando a comparação aparece e de onde vem a régua usada, o próximo passo é ter um plano simples para o momento em que ela surgir de novo — não para eliminá-la (isso não é realista), mas para não ficar presa nela.',
    praticaGuiada: [
      'Defina uma sequência pessoal de quatro passos: notar, nomear ("isso é uma comparação"), afastar a atenção do estímulo, respirar.',
      'Depois, escolha uma ação alinhada aos seus valores para fazer em seguida — continuar o que estava fazendo, escrever uma frase, ou simplesmente seguir em frente.',
      'Guarde essa sequência de forma simples, para lembrar dela na próxima vez.',
    ],
    leveComVoce: 'Você não precisa parar de comparar da noite para o dia — só ter um próximo passo já ajuda.',
    fontesCientificas: ['E4', 'E9'],
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
      'O que é considerado um "corpo ideal" já mudou várias vezes ao longo da história e varia entre culturas diferentes hoje mesmo. Isso mostra que esse ideal não é uma verdade fixa sobre beleza — é uma construção que muda conforme época, lugar e interesses comerciais.',
    praticaGuiada: [
      'Pense (ou pesquise rapidamente, se quiser) em como o "corpo ideal" era retratado em décadas anteriores, ou em outra cultura que você conheça.',
      'Compare mentalmente com o ideal mais comum hoje nas redes que você usa.',
      'Escreva uma frase sobre o que essa mudança revela: um ideal que muda tanto não pode ser uma verdade absoluta.',
    ],
    leveComVoce: 'Se o ideal muda o tempo todo, ele nunca foi sobre você — é sobre a época.',
    fontesCientificas: ['E4'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s2',
    titulo: 'Uma imagem não conta toda a história',
    descricaoCurta: 'Entenda o que fica de fora de uma foto: pose, luz, edição, contexto.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Toda imagem que vemos é resultado de escolhas: ângulo, pose, iluminação, edição, e às vezes cirurgia ou filtro. Isso não significa que a pessoa na foto seja "falsa" — significa que a imagem é um recorte construído, não um registro neutro da realidade.',
    praticaGuiada: [
      'Pense numa foto que costuma te fazer sentir mal em comparação.',
      'Liste o máximo de fatores que podem ter influenciado essa imagem: ângulo, luz, pose ensaiada, filtro, edição, seleção entre várias fotos tiradas.',
      'Perceba quantos desses fatores você não vê acontecer, só vê o resultado final.',
    ],
    reflexao: 'Como fica diferente olhar para essa foto sabendo de tudo isso?',
    leveComVoce: 'Uma imagem é um recorte construído, não um espelho da vida real.',
    fontesCientificas: ['E4', 'E5'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s3',
    titulo: 'O custo de perseguir o impossível',
    descricaoCurta: 'Liste o que o corpo ideal promete e o que ele realmente cobra.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Perseguir um ideal de corpo tem um custo real — tempo, energia, dinheiro, atenção, e às vezes relações. Colocar lado a lado o que esse ideal promete e o que ele cobra ajuda a enxergar essa troca com mais clareza, sem depender só de força de vontade para "não ligar".',
    praticaGuiada: [
      'Divida uma folha (ou o campo de texto) em duas colunas: "O que esse ideal promete" e "O que ele cobra de mim".',
      'Na primeira coluna, anote o que você imagina que ganharia ao alcançar o ideal (aceitação, confiança, admiração).',
      'Na segunda, anote o que já gastou ou gasta perseguindo isso: tempo, energia, dinheiro, momentos de vida.',
      'Olhe as duas colunas juntas, sem pressa.',
    ],
    reflexao: 'O que essa comparação entre as duas colunas revela pra você?',
    leveComVoce: 'Ver o custo com clareza não é desistir de se cuidar — é decidir com mais consciência.',
    fontesCientificas: ['E4', 'E9'],
  }),
  sessao({
    id: 'imagem-corporal-m3-s4',
    titulo: 'Padrões mais flexíveis',
    descricaoCurta: 'Escreva como você quer tratar seu corpo mesmo nos dias mais difíceis.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Depois de questionar de onde vem o ideal de corpo perfeito e o que ele custa, esta sessão propõe substituir essa régua rígida por algo mais seu: uma declaração pessoal, baseada em valores, sobre como você quer se tratar — inclusive (e principalmente) nos dias difíceis.',
    praticaGuiada: [
      'Complete a frase: "Mesmo em dias difíceis, quero tratar meu corpo com..." — escolha palavras que reflitam valores, não aparência (ex.: respeito, paciência, cuidado).',
      'Escreva de duas a três frases curtas descrevendo como isso apareceria na prática, no seu dia a dia.',
      'Guarde essas frases para reler quando precisar.',
    ],
    leveComVoce: 'Um padrão flexível, escolhido por você, aguenta melhor os dias difíceis do que um ideal rígido.',
    fontesCientificas: ['E1', 'E9'],
  }),
]);

const IC_M4 = modulo('imagem-corporal-m4', 'Autocrítica e aceitação corporal', [
  sessao({
    id: 'imagem-corporal-m4-s1',
    titulo: 'Conhecendo a voz crítica',
    descricaoCurta: 'Registre as palavras exatas que sua autocrítica costuma usar.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'A autocrítica sobre o corpo costuma ter frases repetidas — quase um roteiro fixo. Reconhecer as palavras exatas e os gatilhos que a ativam é o primeiro passo para lidar com ela de um jeito diferente, em vez de só tentar "não pensar assim".',
    praticaGuiada: [
      'Lembre de uma frase recente que sua autocrítica disse sobre seu corpo — tente escrever as palavras exatas, não um resumo.',
      'Anote o que estava acontecendo quando essa frase surgiu (o gatilho): um espelho, uma roupa, um comentário, uma foto.',
      'Sem tentar mudar nada ainda, só reconheça: "essa é uma frase que minha autocrítica costuma dizer".',
    ],
    leveComVoce: 'Dar nome à voz crítica já é um jeito de criar uma pequena distância dela.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s2',
    titulo: 'Pensamento não é veredito',
    descricaoCurta: 'Pratique transformar "eu sou" em "estou percebendo o pensamento de que".',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Quando um pensamento crítico surge como "eu sou feia" ou "meu corpo é errado", ele costuma ser sentido como um fato definitivo. Uma técnica simples ajuda a criar distância: reformular o pensamento como algo que está passando pela mente, não como uma verdade sobre quem você é.',
    praticaGuiada: [
      'Pegue a frase de autocrítica que você identificou na sessão anterior (ou uma nova, se surgir agora).',
      'Reescreva-a começando com "Estou percebendo o pensamento de que..." — por exemplo, "Estou percebendo o pensamento de que meu corpo está errado".',
      'Leia as duas versões em voz alta ou mentalmente e note se muda alguma coisa na sensação.',
    ],
    leveComVoce: 'Um pensamento pode passar pela sua mente sem precisar ser a última palavra sobre você.',
    fontesCientificas: ['E9', 'E1'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s3',
    titulo: 'Uma resposta firme e gentil',
    descricaoCurta: 'Construa uma resposta realista para dar à sua autocrítica.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Depois de reconhecer a voz crítica, o próximo passo não é forçar um pensamento positivo artificial ("eu amo meu corpo!"), que muitas vezes soa falso. É construir uma resposta realista — firme o suficiente para não alimentar a crítica, gentil o suficiente para não virar outra forma de exigência.',
    praticaGuiada: [
      'Releia a frase de autocrítica que você identificou.',
      'Escreva uma resposta que seja realista e gentil ao mesmo tempo — por exemplo: "Eu não preciso concordar com esse pensamento para segui-lo em frente."',
      'Evite frases que prometem uma mudança de sentimento imediata ("agora eu me amo") — a ideia é uma resposta sustentável, não uma virada instantânea.',
    ],
    leveComVoce: 'Uma resposta gentil e honesta vale mais do que uma frase positiva forçada.',
    fontesCientificas: ['E1', 'E10'],
  }),
  sessao({
    id: 'imagem-corporal-m4-s4',
    titulo: 'Olhar sem julgar',
    descricaoCurta: 'Um exercício opcional e neutro de observação — sem pressão para continuar.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Esta é uma prática opcional que envolve olhar para uma parte de si (mão, rosto, roupa) com atenção neutra, descrevendo cores, formas e sensações — sem avaliar. Se em algum momento isso aumentar o desconforto, está tudo bem parar; não é obrigatório continuar.',
    praticaGuiada: [
      'Escolha algo simples para observar: sua mão, um trecho de roupa que está usando, ou seu reflexo, se quiser.',
      'Descreva em voz baixa ou mentalmente só o que vê — cor, forma, textura, luz — sem usar palavras de julgamento.',
      'Se surgir desconforto em algum momento, você pode parar agora, sem precisar terminar o exercício.',
    ],
    leveComVoce: 'Você pode escolher até onde ir nesta prática. Parar quando quiser também é uma resposta válida.',
    fontesCientificas: ['E3'],
    avisoSeguranca:
      'Este exercício envolve observar o próprio corpo ou reflexo. É totalmente opcional e pode ser interrompido a qualquer momento — se aumentar o desconforto, pare e volte para uma respiração tranquila.',
  }),
]);

const IC_M5 = modulo('imagem-corporal-m5', 'Neutralidade corporal e autocompaixão', [
  sessao({
    id: 'imagem-corporal-m5-s1',
    titulo: 'Não preciso amar para respeitar',
    descricaoCurta: 'Conheça a ideia de neutralidade corporal como alternativa ao "amor incondicional".',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Muita mensagem sobre imagem corporal exige "amar o próprio corpo" — o que pode soar como mais uma cobrança impossível em dias difíceis. A neutralidade corporal propõe outra meta, mais alcançável: relacionar-se com o corpo com respeito e funcionalidade, sem precisar sentir amor por ele o tempo todo.',
    praticaGuiada: [
      'Leia a frase: "Eu não preciso amar meu corpo para tratá-lo com respeito."',
      'Pense em uma forma de respeito que não depende de gostar da aparência — por exemplo, descansar quando está cansada, ou vestir algo confortável.',
      'Anote essa forma de respeito como um lembrete para os dias em que "amar o corpo" parecer distante demais.',
    ],
    leveComVoce: 'Respeito é uma meta possível todos os dias — amor incondicional nem sempre precisa ser.',
    fontesCientificas: ['E1', 'E3'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s2',
    titulo: 'Pausa de autocompaixão',
    descricaoCurta: 'Pratique uma pausa breve de reconhecimento e apoio interno.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma pausa de autocompaixão é uma prática breve com três partes: reconhecer que o momento é difícil, lembrar que dificuldade faz parte de ser humana (não é só com você), e escolher uma frase de apoio para si mesma. Não exige resolver o problema — só atravessar o momento com mais gentileza.',
    praticaGuiada: [
      'Pense num momento recente de desconforto com seu corpo.',
      'Reconheça em silêncio: "este é um momento difícil".',
      'Lembre-se: "dificuldade com o corpo é algo que muitas pessoas sentem, não é falha minha".',
      'Escolha uma frase de apoio para si mesma neste momento, como diria a uma amiga.',
    ],
    leveComVoce: 'Você não precisa estar sozinha com esse desconforto — ele é mais comum do que parece.',
    fontesCientificas: ['E1', 'E2'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s3',
    titulo: 'Um gesto de segurança',
    descricaoCurta: 'Experimente um gesto físico opcional de acolhimento, no seu ritmo.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Um gesto físico simples — como colocar a mão sobre o peito, um abraço leve nos próprios braços, ou outro contato que pareça seguro — pode ajudar a acompanhar um momento de autocompaixão. É totalmente opcional: se não parecer confortável, respirar naturalmente já é suficiente.',
    praticaGuiada: [
      'Se quiser, escolha um gesto: mão sobre o peito, abraço leve, ou mãos entrelaçadas no colo.',
      'Enquanto mantém o gesto (ou só respira, se preferir não fazer nenhum gesto), respire no seu ritmo natural, sem forçar.',
      'Fique nesse momento por alguns instantes, sem pressa para terminar.',
    ],
    leveComVoce: 'Não existe forma certa de fazer isso — o que for confortável para você já é suficiente.',
    fontesCientificas: ['E1', 'E2'],
  }),
  sessao({
    id: 'imagem-corporal-m5-s4',
    titulo: 'Carta de respeito ao meu corpo',
    descricaoCurta: 'Escreva uma carta breve reconhecendo limites, necessidades e funções do seu corpo.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Escrever para o próprio corpo, com foco em limites, necessidades e funções (não em elogios de aparência), é uma forma de consolidar tudo que este módulo trabalhou. Não precisa ser uma carta de amor — pode ser simplesmente honesta e respeitosa.',
    praticaGuiada: [
      'Comece a carta com "Para o meu corpo," ou qualquer abertura que fizer sentido para você.',
      'Reconheça um limite que ele tem (cansaço, necessidade de descanso, algo que dói).',
      'Reconheça uma necessidade que ele pede (comida, sono, movimento, pausa).',
      'Reconheça uma função que ele cumpre no seu dia a dia.',
      'Termine como quiser — não precisa ser uma declaração de amor, só de respeito.',
    ],
    leveComVoce: 'Uma carta honesta vale mais do que uma carta perfeita.',
    fontesCientificas: ['E1', 'E10'],
  }),
]);

const IC_M6 = modulo('imagem-corporal-m6', 'Influência das redes sociais', [
  sessao({
    id: 'imagem-corporal-m6-s1',
    titulo: 'O algoritmo aprende a prender atenção',
    descricaoCurta: 'Entenda como o feed é montado para prender atenção, não para representar a vida real.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'O feed das redes sociais não mostra "a vida real" de forma neutra — ele é organizado por um sistema que aprende o que prende sua atenção e mostra mais disso. Corpos, comparações e conteúdo emocionalmente intenso costumam prender atenção, então aparecem mais, criando uma amostra distorcida da realidade.',
    praticaGuiada: [
      'Pense no seu feed mais usado e tente lembrar de 3 a 5 tipos de conteúdo que aparecem com mais frequência.',
      'Para cada um, pergunte-se: isso prende atenção por ser interessante, ou por gerar uma reação forte (inveja, insegurança, urgência)?',
      'Escreva uma frase reconhecendo que o feed é construído, não um espelho neutro da vida das pessoas.',
    ],
    leveComVoce: 'O que você vê no feed foi selecionado para prender sua atenção — não é uma amostra aleatória da vida real.',
    fontesCientificas: ['E4', 'E5'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s2',
    titulo: 'Como o meu feed me faz sentir',
    descricaoCurta: 'Audite dez contas ou tipos de conteúdo que você mais vê.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma auditoria simples do próprio feed ajuda a enxergar padrões que passam despercebidos no dia a dia: quais contas ou tipos de conteúdo deixam você bem, e quais deixam insegura ou inadequada.',
    praticaGuiada: [
      'Pense em cerca de dez contas ou tipos de conteúdo que você mais vê (podem ser perfis específicos ou categorias, como "fitness", "moda", "amigos").',
      'Para cada um, marque rapidamente: me faz sentir bem, neutra, ou insegura/inadequada.',
      'Note quantos ficaram em cada categoria.',
    ],
    reflexao: 'Alguma coisa te surpreendeu ao fazer essa lista?',
    leveComVoce: 'Você não precisa mudar nada ainda — só está com mais clareza sobre o que consome.',
    fontesCientificas: ['E4', 'E5'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s3',
    titulo: 'Curadoria também é autocuidado',
    descricaoCurta: 'Ajuste seu feed: silencie o que gera comparação, inclua diversidade.',
    duracaoMinutos: 5,
    tipo: 'plano',
    entendaEm1Minuto:
      'Curar o próprio feed — silenciar, deixar de seguir, ou adicionar contas diferentes — é uma forma legítima de autocuidado, não uma fraqueza. Você não precisa justificar essas escolhas para ninguém.',
    praticaGuiada: [
      'Com base na auditoria da sessão anterior, escolha ao menos uma conta ou tipo de conteúdo que gera comparação para silenciar ou deixar de seguir.',
      'Pense em um tipo de conteúdo diferente que você poderia adicionar — algo sobre um interesse seu que não seja ligado à aparência.',
      'Se puder, faça essas mudanças agora mesmo; se não, anote para fazer em breve.',
    ],
    leveComVoce: 'Curar seu feed é cuidar da sua mente, do mesmo jeito que escolher com quem passar seu tempo.',
    fontesCientificas: ['E5'],
  }),
  sessao({
    id: 'imagem-corporal-m6-s4',
    titulo: 'Meu acordo digital por sete dias',
    descricaoCurta: 'Crie um pequeno experimento de sete dias com limites e uma atividade substituta.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Um experimento curto — não uma regra para sempre — ajuda a testar como você se sente com menos exposição a conteúdo que gera comparação. A ideia não é se privar, é observar o efeito de um ajuste temporário e decidir com informação real.',
    praticaGuiada: [
      'Escolha um limite simples para os próximos sete dias: um horário sem redes sociais, um tempo máximo por dia, ou evitar abrir certos apps logo ao acordar.',
      'Escolha uma atividade substituta significativa para os momentos em que normalmente abriria o app — pode ser ler, caminhar, ligar para alguém.',
      'Anote os dois combinados de forma simples, como um acordo consigo mesma, não uma regra rígida.',
    ],
    leveComVoce: 'É um experimento de sete dias, não uma promessa para sempre — você pode ajustar o que aprender.',
    fontesCientificas: ['E5'],
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
      'A crítica interna costuma ter um vocabulário e um tom próprios, quase como uma voz separada. Reconhecer as frases exatas que ela usa, e em que situações aparece, é o primeiro passo para lidar com ela de forma diferente.',
    praticaGuiada: [
      'Lembre de um momento recente em que sua crítica interna falou alto.',
      'Anote a frase exata que ela disse, e o tom (duro, sarcástico, decepcionado).',
      'Anote a situação que disparou essa crítica.',
    ],
    leveComVoce: 'Reconhecer o padrão da sua crítica interna já é um primeiro passo — sem precisar concordar com ela.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m1-s2',
    titulo: 'O que essa crítica tenta evitar',
    descricaoCurta: 'Explore que função protetora (imperfeita) a crítica pode estar tentando cumprir.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Muitas vezes a crítica interna surge tentando evitar algo — rejeição, erro, perda de controle. Entender essa intenção (mesmo que a estratégia seja ruim) não justifica a agressão que ela usa, mas ajuda a responder a ela com mais compreensão do que oposição.',
    praticaGuiada: [
      'Pegue a crítica que você identificou na sessão anterior.',
      'Pergunte-se: o que ela está tentando evitar que aconteça? (rejeição, decepcionar alguém, cometer um erro, perder controle)',
      'Escreva uma frase reconhecendo essa intenção, sem aceitar o tom agressivo: "Entendo que você está tentando me proteger de X, mas esse jeito não está ajudando."',
    ],
    leveComVoce: 'Entender a intenção por trás da crítica não significa concordar com o jeito que ela fala com você.',
    fontesCientificas: ['E1', 'E9'],
  }),
  sessao({
    id: 'autocompaixao-m1-s3',
    titulo: 'Da crítica para a orientação',
    descricaoCurta: 'Reescreva uma cobrança interna como instrução clara e possível.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Muita crítica interna vem em forma de cobrança vaga ("você deveria ser melhor"). Transformar isso em orientação específica e realizável é mais útil e mais gentil — dá um caminho, em vez de só um julgamento.',
    praticaGuiada: [
      'Escolha uma cobrança recente da sua crítica interna.',
      'Reescreva-a como uma instrução específica, respeitosa e possível — por exemplo, de "você deveria dar conta de tudo" para "hoje posso focar em uma coisa de cada vez".',
      'Leia a nova versão e note a diferença de sensação.',
    ],
    leveComVoce: 'Uma instrução clara ajuda mais do que uma cobrança vaga.',
    fontesCientificas: ['E1', 'E9'],
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
      'Existe uma diferença importante entre sentir culpa por uma ação específica e concluir que você é, no fundo, uma pessoa ruim. A primeira é sobre um comportamento; a segunda vira identidade — e identidade é muito mais difícil de mudar do que um comportamento.',
    praticaGuiada: [
      'Pense numa situação recente que gerou culpa.',
      'Escreva a versão "ação": o que exatamente você fez ou deixou de fazer.',
      'Escreva a versão "identidade" que sua mente talvez tenha criado: "eu sou..."',
      'Compare as duas frases e note qual delas é mais específica e mais fácil de lidar.',
    ],
    leveComVoce: 'Um comportamento pode ser revisto. Uma identidade fixa é bem mais difícil de carregar.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m2-s2',
    titulo: 'Reconhecer, reparar e aprender',
    descricaoCurta: 'Separe o que pode ser reparado, o que pode ser aprendido e o que pode ser deixado ir.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Diante de uma culpa real, é útil separar três caminhos possíveis: o que dá para reparar (um pedido de desculpas, uma ação corretiva), o que dá para aprender (um ajuste para a próxima vez), e o que só resta deixar ir (porque já passou e não há mais o que fazer).',
    praticaGuiada: [
      'Pense na situação que gerou culpa.',
      'Pergunte: existe algo que posso reparar aqui? Se sim, o quê?',
      'Pergunte: existe algo que posso aprender para uma próxima vez?',
      'Pergunte: existe uma parte disso que só resta deixar ir, porque já passou?',
      'Escreva as três respostas, mesmo que uma delas seja "nada a fazer aqui".',
    ],
    leveComVoce: 'Nem toda culpa pede reparação — às vezes ela só pede reconhecimento e aprendizado.',
    fontesCientificas: ['E1', 'E9'],
  }),
  sessao({
    id: 'autocompaixao-m2-s3',
    titulo: 'Quando continuar se punindo não ajuda',
    descricaoCurta: 'Crie uma frase de responsabilidade que não vire punição permanente.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Existe uma diferença entre se responsabilizar por algo e se punir por tempo indeterminado. A primeira ajuda a seguir em frente; a segunda só prolonga o sofrimento sem gerar mudança real.',
    praticaGuiada: [
      'Pense em algo que você ainda está "pagando" mentalmente, mesmo já tendo reconhecido e feito o possível para reparar.',
      'Escreva uma frase de responsabilidade que tenha um fim — por exemplo: "Eu reconheço o que aconteceu, fiz o que podia fazer, e agora escolho seguir em frente."',
      'Releia essa frase sempre que a autopunição voltar a aparecer sobre esse mesmo assunto.',
    ],
    leveComVoce: 'Responsabilidade tem um propósito. Punição sem fim só desgasta.',
    fontesCientificas: ['E1'],
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
      'A vergonha costuma vir acompanhada de uma sensação de "defeito" — não "eu fiz algo errado", mas "há algo errado comigo". Essa sensação empurra para o silêncio e o isolamento, porque parece mais seguro esconder do que mostrar. Entender esse mecanismo já ajuda a enfraquecê-lo um pouco.',
    praticaGuiada: [
      'Pense em algo que você guarda com vergonha, mesmo que pequeno.',
      'Note se a sensação é mais de "eu fiz algo errado" ou de "há algo errado comigo".',
      'Sem precisar compartilhar com ninguém agora, só reconheça: "isso é vergonha, e ela está pedindo silêncio".',
    ],
    leveComVoce: 'Nomear a vergonha já tira um pouco do poder dela sobre você.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m3-s2',
    titulo: 'Eu não sou a única',
    descricaoCurta: 'Pratique a humanidade comum sem minimizar sua dor.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Humanidade comum é a ideia de que sofrimento, erro e imperfeição fazem parte de ser humano — não são exclusividade sua. Isso não significa minimizar o que você sente; significa lembrar que você não está sozinha nessa experiência, mesmo que pareça.',
    praticaGuiada: [
      'Pense na situação de vergonha que você reconheceu na sessão anterior.',
      'Complete a frase: "Muitas pessoas, em algum momento, já sentiram algo parecido com isso."',
      'Note que reconhecer isso não apaga sua dor — só te lembra que ela é humana, não uma falha exclusiva sua.',
    ],
    leveComVoce: 'Sentir vergonha não te torna diferente das outras pessoas — te torna humana, como todas elas.',
    fontesCientificas: ['E1', 'E2'],
  }),
  sessao({
    id: 'autocompaixao-m3-s3',
    titulo: 'Escolhendo apoio com segurança',
    descricaoCurta: 'Avalie se existe alguém de confiança para compartilhar — sem obrigação.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Compartilhar algo que gera vergonha com alguém de confiança pode aliviar o peso dela — mas isso é uma escolha, nunca uma obrigação. Esta sessão é só sobre avaliar se existe essa pessoa, não sobre forçar uma conversa.',
    praticaGuiada: [
      'Pense se existe alguém em quem você confia o suficiente para compartilhar algo que sente vergonha.',
      'Se existir, imagine como seria essa conversa — não precisa ter agora, só imaginar.',
      'Se não existir ninguém agora, tudo bem: reconheça isso sem se cobrar por não ter com quem falar.',
    ],
    leveComVoce: 'Compartilhar pode aliviar, mas é sempre uma escolha sua — nunca uma obrigação.',
    fontesCientificas: ['E1'],
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
      'Uma forma simples de notar a diferença entre autocrítica e gentileza é comparar: o que você diria a uma amiga passando pela mesma situação que você está vivendo agora? Costuma ser bem diferente do que você diz para si mesma.',
    praticaGuiada: [
      'Pense numa dificuldade atual sua.',
      'Escreva o que sua mente diz sobre isso para você mesma.',
      'Escreva o que você diria a uma amiga querida na mesma situação.',
      'Compare as duas versões lado a lado.',
    ],
    reflexao: 'O que te impede de falar consigo do mesmo jeito que falaria com uma amiga?',
    leveComVoce: 'Você merece pelo menos a mesma gentileza que ofereceria a alguém que ama.',
    fontesCientificas: ['E1', 'E2'],
  }),
  sessao({
    id: 'autocompaixao-m4-s2',
    titulo: 'Um pequeno gesto de cuidado',
    descricaoCurta: 'Escolha uma ação viável de dois minutos para se cuidar hoje.',
    duracaoMinutos: 5,
    tipo: 'plano',
    entendaEm1Minuto:
      'Gentileza consigo mesma não precisa ser um grande gesto — pode ser algo pequeno e viável, feito hoje. A ideia é criar o hábito de agir com cuidado, não esperar um momento perfeito para isso.',
    praticaGuiada: [
      'Pense em uma ação de cuidado que leve só dois minutos: tomar água, esticar o corpo, respirar fundo três vezes, escrever uma frase gentil.',
      'Escolha uma e faça agora, se possível.',
      'Note como foi permitir esse pequeno momento para si mesma.',
    ],
    leveComVoce: 'Gentileza consigo mesma pode caber em dois minutos.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m4-s3',
    titulo: 'Gentileza também pode ser ação',
    descricaoCurta: 'Transforme apoio interno em descanso, organização, pedido de ajuda ou limite.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Gentileza consigo mesma nem sempre é uma frase de conforto — às vezes é uma ação prática: descansar quando precisa, organizar algo que está pesando, pedir ajuda, ou colocar um limite. Esta sessão convida a pensar em gentileza como algo que se faz, não só que se sente.',
    praticaGuiada: [
      'Pense em uma área da sua vida que está pedindo cuidado prático agora: descanso, organização, ajuda de alguém, ou um limite que precisa ser colocado.',
      'Escolha uma ação concreta nessa área.',
      'Anote quando você pretende fazer essa ação.',
    ],
    leveComVoce: 'Às vezes, o gesto mais gentil é uma ação prática, não uma frase de conforto.',
    fontesCientificas: ['E1', 'E9'],
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
      'Precisar acertar sempre tem um custo real: adiar tarefas por medo de fazer errado, exaustão de tentar controlar tudo, e medo constante de julgamento. Mapear esse custo ajuda a enxergar o perfeccionismo não como uma virtude, mas como algo que também cobra um preço.',
    praticaGuiada: [
      'Pense numa área da sua vida onde você sente que "precisa acertar sempre".',
      'Anote um exemplo de algo que você adiou por medo de não fazer perfeito.',
      'Anote como essa exigência te deixa fisicamente — cansada, tensa, ansiosa.',
    ],
    leveComVoce: 'Perceber o custo do perfeccionismo não é fraqueza — é um primeiro passo para aliviar essa exigência.',
    fontesCientificas: ['E1', 'E9'],
  }),
  sessao({
    id: 'autocompaixao-m5-s2',
    titulo: 'Um experimento suficientemente bom',
    descricaoCurta: 'Faça uma tarefa pequena com o critério "bom o bastante" e observe o resultado.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      '"Bom o bastante" é um critério diferente de "perfeito" — é sobre fazer algo que cumpre seu propósito, sem exigir excelência em cada detalhe. Este é um experimento prático: fazer algo pequeno com esse critério e observar o que realmente acontece.',
    praticaGuiada: [
      'Escolha uma tarefa pequena que você pode fazer hoje ou nos próximos dias.',
      'Antes de começar, defina o que seria "bom o bastante" para essa tarefa — não perfeito, só funcional.',
      'Faça a tarefa com esse critério em mente.',
      'Observe o resultado real, sem comparar com um ideal imaginário.',
    ],
    leveComVoce: '"Bom o bastante" muitas vezes já é suficiente — e custa muito menos.',
    fontesCientificas: ['E9'],
  }),
  sessao({
    id: 'autocompaixao-m5-s3',
    titulo: 'Aprender sem se humilhar',
    descricaoCurta: 'Revise o experimento: o que funcionou, o que mudaria, qual o próximo passo.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Revisar uma experiência sem se humilhar significa observar o que funcionou e o que poderia mudar, sem transformar isso num julgamento sobre seu valor. É uma habilidade que fica mais fácil com prática.',
    praticaGuiada: [
      'Pense na tarefa "bom o bastante" que você fez (ou em qualquer tarefa recente).',
      'Anote o que funcionou bem nela.',
      'Anote uma coisa que você faria diferente da próxima vez — como ajuste, não como crítica.',
      'Defina, se fizer sentido, um próximo passo pequeno.',
    ],
    leveComVoce: 'Revisar com curiosidade ensina mais do que revisar com julgamento.',
    fontesCientificas: ['E9', 'E1'],
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
      'Dar nome a uma emoção — mesmo que de forma simples — já ajuda a regulá-la um pouco. Perceber a intensidade (numa escala pessoal) e onde ela aparece no corpo (aperto no peito, nó na garganta) traz mais clareza sobre o que está acontecendo agora.',
    praticaGuiada: [
      'Pare um momento e pergunte-se: o que estou sentindo agora?',
      'Dê um nome simples a essa emoção (ansiedade, tristeza, raiva, cansaço).',
      'Numa escala de 1 a 10, qual a intensidade?',
      'Onde no corpo você sente isso?',
    ],
    leveComVoce: 'Nomear uma emoção não a resolve, mas já ajuda a lidar com ela com mais clareza.',
    fontesCientificas: ['E9'],
  }),
  sessao({
    id: 'autocompaixao-m6-s2',
    titulo: 'Abrir espaço sem se afogar',
    descricaoCurta: 'Use os sentidos para se aterrar e dar espaço à emoção, sem ser dominada por ela.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Dar espaço a uma emoção difícil não significa se afogar nela. Uma prática de aterramento pelos sentidos ajuda a permanecer presente enquanto a emoção existe, sem lutar contra ela nem ser completamente tomada por ela.',
    praticaGuiada: [
      'Note a emoção presente, sem tentar mudá-la ainda.',
      'Observe algo que você pode ver ao seu redor.',
      'Observe algo que você pode ouvir.',
      'Observe algo que você pode sentir tocando (a roupa, a cadeira, o chão).',
      'Permita que a emoção exista por mais alguns instantes, agora com esse apoio dos sentidos.',
    ],
    leveComVoce: 'Você pode sentir uma emoção difícil e, ao mesmo tempo, continuar presente e segura.',
    fontesCientificas: ['E9'],
  }),
  sessao({
    id: 'autocompaixao-m6-s3',
    titulo: 'Escolher o próximo passo',
    descricaoCurta: 'Crie um menu pessoal de ações: acalmar, resolver, ou procurar apoio.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de nomear e dar espaço a uma emoção, é útil ter um pequeno menu de próximos passos possíveis — nem toda emoção pede a mesma ação. Às vezes é preciso só acalmar; às vezes, resolver algo prático; às vezes, buscar apoio de alguém.',
    praticaGuiada: [
      'Pense em três categorias de resposta: acalmar (respirar, descansar), resolver (agir sobre algo prático), buscar apoio (falar com alguém).',
      'Para a emoção que você está sentindo agora ou sentiu recentemente, escolha qual categoria parece mais adequada.',
      'Defina uma ação concreta dentro dessa categoria.',
    ],
    leveComVoce: 'Nem toda emoção pede a mesma resposta — ter opções ajuda a escolher a mais adequada.',
    fontesCientificas: ['E9'],
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
      'Às vezes um desconforto geral esconde uma necessidade específica que ainda não foi identificada. Separar necessidades em categorias — física, emocional, prática, relacional — ajuda a encontrar com mais clareza do que você precisa agora.',
    praticaGuiada: [
      'Pare e pergunte: o que eu preciso agora?',
      'Considere as quatro categorias: física (descanso, comida, movimento), emocional (conforto, validação), prática (organizar algo, resolver uma pendência), relacional (conversar com alguém, pedir ajuda).',
      'Identifique qual categoria parece mais presente agora.',
    ],
    leveComVoce: 'Identificar a necessidade certa já é meio caminho para atendê-la.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m7-s2',
    titulo: 'Um limite também é cuidado',
    descricaoCurta: 'Crie uma frase curta e respeitosa para dizer não, pedir tempo ou renegociar.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Colocar um limite — dizer não, pedir mais tempo, renegociar um combinado — é uma forma de cuidado, tanto consigo quanto com a relação. Ter uma frase pronta ajuda a fazer isso sem se sentir despreparada no momento.',
    praticaGuiada: [
      'Pense numa situação em que você poderia se beneficiar de colocar um limite.',
      'Escreva uma frase curta e respeitosa para isso — por exemplo: "Não vou conseguir agora, mas posso na próxima semana."',
      'Guarde essa frase (ou o formato dela) para usar quando precisar.',
    ],
    leveComVoce: 'Um limite bem colocado é cuidado, não rejeição.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'autocompaixao-m7-s3',
    titulo: 'Minha voz de apoio',
    descricaoCurta: 'Crie um cartão pessoal com três frases realistas e três ações de cuidado.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Esta última sessão da jornada reúne o que foi trabalhado: um pequeno "cartão" pessoal com frases de apoio realistas e ações de cuidado, para consultar em momentos difíceis — um resumo prático de tudo que você já construiu ao longo da jornada.',
    praticaGuiada: [
      'Escreva três frases de apoio realistas (não positividade forçada) que você gostaria de ouvir de si mesma em dias difíceis.',
      'Escreva três ações de cuidado que você já sabe que funcionam para você (descanso, respirar, falar com alguém, etc.).',
      'Guarde essas seis frases juntas — esse é o seu cartão pessoal de apoio.',
    ],
    leveComVoce: 'Você acabou de construir algo seu: um lembrete de apoio para os próprios dias difíceis.',
    fontesCientificas: ['E1', 'E2', 'E10'],
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
    titulo: 'Meu mapa de comparação',
    descricaoCurta: 'Mapeie pessoas, assuntos, ambientes e horários em que você mais se compara.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comparação social é um comportamento humano comum, mas costuma ter padrões específicos: certas pessoas, certos assuntos, certos horários ou ambientes que a disparam mais. Mapear esse padrão é o primeiro passo para lidar com ele.',
    praticaGuiada: [
      'Pense nos últimos dias e identifique um momento de comparação.',
      'Anote: com quem (ou o quê) você se comparou, sobre qual assunto, em que ambiente, e a que horas.',
      'Repita para outro momento, se lembrar de mais de um.',
    ],
    leveComVoce: 'Ver o padrão com clareza já ajuda a se preparar para a próxima vez que ele aparecer.',
    fontesCientificas: ['E4', 'E1'],
  }),
  sessao({
    id: 'comparacao-m1-s2',
    titulo: 'Eu vejo um recorte, não a vida inteira',
    descricaoCurta: 'Trabalhe a diferença entre o que é visível e o que fica de fora.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Quando comparamos nossa vida inteira (com dificuldades, dúvidas, dias ruins) com o recorte visível da vida de outra pessoa, a comparação já começa desequilibrada. Lembrar dessa diferença ajuda a colocar as coisas em perspectiva.',
    praticaGuiada: [
      'Pense em uma comparação recente que te incomodou.',
      'Liste o que você viu (o recorte visível) e o que você não pode saber sobre o resto da vida dessa pessoa.',
      'Escreva uma frase reconhecendo que você está comparando um recorte com sua vida inteira.',
    ],
    leveComVoce: 'Você está comparando um recorte com a sua vida inteira — essa comparação nunca foi justa.',
    fontesCientificas: ['E4'],
  }),
  sessao({
    id: 'comparacao-m1-s3',
    titulo: 'Pausa de noventa segundos',
    descricaoCurta: 'Pratique notar, respirar, afastar o estímulo e escolher uma ação.',
    duracaoMinutos: 5,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Uma pausa curta e estruturada pode interromper o ciclo automático da comparação. Não é sobre nunca comparar — é sobre ter um espaço entre o impulso e a ação seguinte.',
    praticaGuiada: [
      'Quando notar que está se comparando, pare por um momento.',
      'Respire fundo três vezes, no seu ritmo natural.',
      'Afaste a atenção do estímulo (feche o app, olhe para outro lugar).',
      'Escolha conscientemente o que fazer a seguir.',
    ],
    leveComVoce: 'Noventa segundos de pausa já bastam para mudar o rumo de um pensamento automático.',
    fontesCientificas: ['E9'],
  }),
]);

const CP_M2 = modulo('comparacao-m2', 'Redes sociais', [
  sessao({
    id: 'comparacao-m2-s1',
    titulo: 'Como o feed seleciona o que eu vejo',
    descricaoCurta: 'Entenda o papel do algoritmo, da repetição e do engajamento no que você vê.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'O que aparece no seu feed não é aleatório — é resultado de um sistema que aprende o que gera mais engajamento (tempo de tela, curtidas, comentários) e mostra mais conteúdo parecido. Isso inclui, com frequência, conteúdo que gera comparação.',
    praticaGuiada: [
      'Pense em um tipo de conteúdo que aparece repetidamente no seu feed.',
      'Reflita: esse conteúdo prende sua atenção por interesse genuíno, ou por gerar uma reação forte?',
      'Escreva uma frase reconhecendo o papel do algoritmo nessa repetição.',
    ],
    leveComVoce: 'O que você vê foi selecionado para prender sua atenção — isso não é um acaso.',
    fontesCientificas: ['E4', 'E5'],
  }),
  sessao({
    id: 'comparacao-m2-s2',
    titulo: 'Limpar sem desaparecer',
    descricaoCurta: 'Faça uma curadoria de contas, palavras, horários e notificações.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      '"Limpar" o feed não significa sumir das redes — significa ajustar o que você consome para que gere menos comparação e mais bem-estar. Pequenos ajustes (silenciar contas, mutar palavras, desligar notificações) já fazem diferença.',
    praticaGuiada: [
      'Escolha uma conta que costuma gerar comparação para silenciar ou deixar de seguir.',
      'Se o app permitir, mute uma palavra-chave ou tópico que costuma incomodar.',
      'Revise as notificações ativas e desligue uma que não seja necessária.',
    ],
    leveComVoce: 'Ajustar o que você consome é cuidado, não fuga.',
    fontesCientificas: ['E5'],
  }),
  sessao({
    id: 'comparacao-m2-s3',
    titulo: 'Experimento de uso intencional',
    descricaoCurta: 'Defina uma intenção antes de abrir a rede, por sete dias.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Definir uma intenção antes de abrir uma rede social ("vou ver mensagens" em vez de "vou só dar uma olhada") ajuda a usar o app de forma mais consciente, em vez de entrar no scroll automático. Registrar como você se sente antes e depois, por sete dias, dá informação real sobre o efeito desse hábito.',
    praticaGuiada: [
      'Nos próximos sete dias, antes de abrir uma rede social, defina uma intenção clara (ver algo específico, responder uma mensagem).',
      'Anote rapidamente como você se sente antes de abrir.',
      'Depois de usar, anote como se sente ao fechar.',
      'Ao fim dos sete dias, revise os registros e note padrões.',
    ],
    leveComVoce: 'Sete dias de observação te dão informação real — mais confiável do que qualquer regra genérica.',
    fontesCientificas: ['E5'],
  }),
]);

const CP_M3 = modulo('comparacao-m3', 'Sensação de não ser suficiente', [
  sessao({
    id: 'comparacao-m3-s1',
    titulo: 'A frase "não sou suficiente"',
    descricaoCurta: 'Torne o pensamento específico: suficiente para quem, em quê, segundo qual regra?',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      '"Não sou suficiente" é uma frase vaga e generalizante. Torná-la específica — suficiente para quem, em que área, segundo qual régua — ajuda a examinar se ela realmente se sustenta, em vez de deixá-la pairar como uma sentença geral.',
    praticaGuiada: [
      'Pegue a frase "não sou suficiente" (ou uma parecida que você já tenha pensado).',
      'Pergunte: suficiente para quem? Em qual área da vida especificamente? Segundo qual regra ou padrão?',
      'Reescreva a frase de forma mais específica, com essas respostas.',
    ],
    leveComVoce: 'Uma frase específica é mais fácil de examinar do que uma sentença vaga sobre quem você é.',
    fontesCientificas: ['E1', 'E9'],
  }),
  sessao({
    id: 'comparacao-m3-s2',
    titulo: 'Uma visão mais completa',
    descricaoCurta: 'Registre evidências a favor, contra e informações que estão faltando.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Examinar um pensamento como "não sou suficiente" com mais cuidado envolve olhar para evidências a favor, evidências contra, e reconhecer o que você simplesmente não sabe. Isso não é sobre provar que o pensamento é falso — é sobre ter uma visão mais completa.',
    praticaGuiada: [
      'Escreva a versão específica do pensamento (da sessão anterior).',
      'Liste evidências que parecem apoiar esse pensamento.',
      'Liste evidências que contradizem esse pensamento.',
      'Anote o que você não sabe ao certo — informação que está faltando.',
    ],
    leveComVoce: 'Uma visão mais completa quase sempre é menos definitiva do que o pensamento original parecia.',
    fontesCientificas: ['E9'],
  }),
  sessao({
    id: 'comparacao-m3-s3',
    titulo: 'Meu valor tem mais de uma dimensão',
    descricaoCurta: 'Construa um mapa com relações, valores, habilidades, interesses e escolhas.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'A sensação de "não ser suficiente" costuma vir de medir o valor pessoal por uma única régua (aparência, sucesso, produtividade). Um mapa mais amplo — relações, valores, habilidades, interesses, escolhas — ajuda a lembrar que você é composta por muito mais do que essa régua única.',
    praticaGuiada: [
      'Desenhe (ou liste) cinco áreas: relações, valores, habilidades, interesses, escolhas que você já fez.',
      'Escreva pelo menos uma coisa real em cada área.',
      'Olhe o mapa completo — note como ele é mais amplo do que a régua única que gerava a sensação de insuficiência.',
    ],
    leveComVoce: 'Você é mais do que a régua que estava usando para se medir.',
    fontesCientificas: ['E1'],
  }),
]);

const CP_M4 = modulo('comparacao-m4', 'Insegurança e busca por validação', [
  sessao({
    id: 'comparacao-m4-s1',
    titulo: 'O ciclo da confirmação',
    descricaoCurta: 'Identifique o padrão: dúvida, pedido de confirmação, alívio curto, retorno da dúvida.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Buscar validação externa (perguntar "estou bem assim?", checar curtidas, pedir opinião repetidamente) costuma seguir um ciclo: surge a dúvida, você busca confirmação, sente um alívio curto, e a dúvida volta pouco depois. Reconhecer esse ciclo ajuda a lidar com ele de forma diferente.',
    praticaGuiada: [
      'Pense num momento recente em que você buscou validação de alguém sobre algo.',
      'Mapeie o ciclo: qual foi a dúvida inicial? Como você buscou confirmação? Quanto durou o alívio? A dúvida voltou depois?',
      'Só observe o padrão, sem se cobrar por ele.',
    ],
    leveComVoce: 'Reconhecer o ciclo já é um passo — ele não precisa desaparecer de uma vez.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'comparacao-m4-s2',
    titulo: 'Validar sem mentir para mim',
    descricaoCurta: 'Reconheça esforço, emoção e intenção sem garantir um resultado.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'É possível se validar internamente sem prometer resultados que não dependem só de você. Reconhecer o esforço, a emoção envolvida e a boa intenção é uma validação honesta — diferente de garantir "vai dar tudo certo", que nem sempre é verdade.',
    praticaGuiada: [
      'Pense em algo que você fez recentemente e queria que alguém validasse.',
      'Escreva: "Eu me esforcei para..." (reconhecendo o esforço real).',
      'Escreva: "Eu senti..." (reconhecendo a emoção envolvida).',
      'Escreva: "Minha intenção era..." (reconhecendo a boa intenção, mesmo sem garantir o resultado).',
    ],
    leveComVoce: 'Você pode reconhecer seu próprio esforço sem precisar prometer um resultado perfeito.',
    fontesCientificas: ['E1', 'E9'],
  }),
  sessao({
    id: 'comparacao-m4-s3',
    titulo: 'Uma pequena decisão minha',
    descricaoCurta: 'Escolha algo de baixo risco sem pedir aprovação, e observe a experiência.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Um experimento pequeno e de baixo risco — tomar uma decisão simples sem pedir opinião de ninguém — ajuda a praticar confiar no próprio julgamento, num contexto onde o resultado não tem grandes consequências.',
    praticaGuiada: [
      'Escolha uma decisão pequena e de baixo risco: o que vestir, o que comer, qual caminho seguir.',
      'Decida sozinha, sem pedir opinião de ninguém.',
      'Depois, observe como foi essa experiência — não para julgar se foi a decisão "certa", mas para notar como foi decidir sozinha.',
    ],
    leveComVoce: 'Pequenas decisões sozinhas ajudam a construir confiança no próprio julgamento.',
    fontesCientificas: ['E1'],
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
      'Valores pessoais são diferentes de metas — são direções que importam para você, independentemente de resultado. Identificar alguns valores centrais e traduzi-los em comportamentos concretos ajuda a viver de forma mais alinhada com quem você é, não com o que se espera de você.',
    praticaGuiada: [
      'Pense em três valores que importam de verdade para você (ex.: honestidade, cuidado, criatividade, conexão).',
      'Para cada valor, escreva um comportamento concreto que o expressa no seu dia a dia.',
      'Guarde essa lista — ela pode ser um ponto de referência para decisões futuras.',
    ],
    leveComVoce: 'Valores são uma bússola mais estável do que a aprovação dos outros.',
    fontesCientificas: ['E9'],
  }),
  sessao({
    id: 'comparacao-m5-s2',
    titulo: 'Quem sou e quem tento parecer',
    descricaoCurta: 'Compare escolhas autênticas e escolhas guiadas só por aprovação.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Nem toda escolha que fazemos é totalmente autêntica — algumas são feitas pensando principalmente em como seremos vistas. Reconhecer essa diferença, sem se culpar por ela (é humano fazer as duas coisas), ajuda a ter mais clareza sobre o que realmente é seu.',
    praticaGuiada: [
      'Pense em duas escolhas recentes: uma que você sente que foi genuinamente sua, e outra que foi mais guiada por como seria vista.',
      'Escreva o que diferencia as duas.',
      'Sem se julgar, note que as duas fazem parte de ser humana.',
    ],
    leveComVoce: 'Nem toda escolha precisa ser 100% autêntica o tempo todo — perceber a diferença já é valioso.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'comparacao-m5-s3',
    titulo: 'Um ato mais alinhado',
    descricaoCurta: 'Escolha uma ação pequena coerente com um dos seus valores.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de identificar valores e notar a diferença entre autenticidade e busca por aprovação, esta sessão propõe uma ação prática: escolher algo pequeno, coerente com um valor seu, para fazer nos próximos dias.',
    praticaGuiada: [
      'Releia os três valores que você escreveu antes.',
      'Escolha um deles e pense numa ação pequena e concreta que o expresse.',
      'Defina quando você vai fazer essa ação.',
    ],
    leveComVoce: 'Um pequeno ato alinhado com seus valores vale mais do que muitos atos alinhados só com aprovação alheia.',
    fontesCientificas: ['E9'],
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
      'Reconhecer qualidades próprias fica mais fácil quando ancorado em situações reais, não em afirmações abstratas. Isso torna o reconhecimento mais concreto e mais fácil de acreditar.',
    praticaGuiada: [
      'Pense em três qualidades suas (podem ser pequenas: paciência, curiosidade, cuidado com os outros).',
      'Para cada uma, lembre de uma situação real e específica em que essa qualidade apareceu.',
      'Escreva as três qualidades junto com suas respectivas situações.',
    ],
    leveComVoce: 'Uma qualidade com uma prova real por trás é mais fácil de reconhecer de verdade.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'comparacao-m6-s2',
    titulo: 'Comparar com o meu próprio caminho',
    descricaoCurta: 'Observe aprendizado e esforço próprios, em vez de ranking com os outros.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Uma alternativa à comparação com outras pessoas é comparar consigo mesma ao longo do tempo — observando aprendizado e esforço próprios, não um ranking externo. Essa é uma régua que só você pode usar de forma justa.',
    praticaGuiada: [
      'Pense numa habilidade ou área em que você sente que evoluiu, mesmo que pouco, no último ano.',
      'Escreva o que mudou — não em comparação com ninguém, só comparando você com você mesma antes.',
      'Reconheça o esforço que houve nesse caminho, independente do resultado final.',
    ],
    leveComVoce: 'A única comparação realmente justa é entre você agora e você antes.',
    fontesCientificas: ['E1'],
  }),
  sessao({
    id: 'comparacao-m6-s3',
    titulo: 'Plano para quando a comparação voltar',
    descricaoCurta: 'Registre gatilhos, sinais, frase de interrupção, ação e pessoa de apoio.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Esta última sessão da jornada reúne tudo em um plano simples para os momentos em que a comparação voltar a aparecer — porque ela provavelmente vai voltar, e ter um plano pronto ajuda mais do que tentar improvisar no momento.',
    praticaGuiada: [
      'Anote um ou dois gatilhos comuns de comparação para você (redes sociais, certas pessoas, certos assuntos).',
      'Anote um sinal no corpo ou na mente que costuma indicar que a comparação começou.',
      'Escolha uma frase curta de interrupção (ex.: "isso é comparação, e eu posso escolher outra coisa agora").',
      'Escolha uma ação para fazer em seguida.',
      'Se fizer sentido, anote uma pessoa que você poderia procurar em momentos mais difíceis.',
    ],
    leveComVoce: 'Você agora tem um plano seu para quando a comparação aparecer de novo — e ela vai aparecer, e está tudo bem.',
    fontesCientificas: ['E4', 'E9'],
  }),
]);

const JORNADA_COMPARACAO: Jornada = {
  id: 'comparacao',
  slug: 'comparacao',
  titulo: 'Comparação',
  descricaoCurta: 'Reduza a comparação social e fortaleça o reconhecimento de si mesma.',
  corCartao: 'lilas',
  modulos: [CP_M1, CP_M2, CP_M3, CP_M4, CP_M5, CP_M6],
};

// ============================================================
// JORNADA 4 — ALIMENTAÇÃO EMOCIONAL (7 módulos, 20 sessões)
// ============================================================

const AE_M1 = modulo('alimentacao-emocional-m1', 'Fome física e fome emocional', [
  sessao({
    id: 'alimentacao-emocional-m1-s1',
    titulo: 'Fome não é uma prova',
    descricaoCurta: 'Entenda que os sinais de fome variam, e que fome física e emoção podem coexistir.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Fome não é um evento único e uniforme — os sinais variam de pessoa para pessoa e de momento para momento. Além disso, fome física e necessidade emocional podem acontecer ao mesmo tempo; uma não anula a outra, e você não precisa provar qual é "a real" antes de agir.',
    praticaGuiada: [
      'Pense na última vez que sentiu fome.',
      'Anote quais sinais físicos você percebeu (se percebeu algum).',
      'Reconheça que não existe uma única forma "certa" de sentir fome.',
    ],
    leveComVoce: 'Você não precisa provar sua fome para ter permissão de atendê-la.',
    fontesCientificas: ['E6', 'E7'],
  }),
  sessao({
    id: 'alimentacao-emocional-m1-s2',
    titulo: 'Três pistas do momento',
    descricaoCurta: 'Observe sinais corporais, urgência emocional e contexto — sem julgar como certo ou errado.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Antes de comer, observar três pistas — sinais no corpo, a urgência emocional do momento, e o contexto (hora do dia, o que já comeu, o que está sentindo) — ajuda a entender melhor o momento presente, sem precisar classificar a fome como certa ou errada.',
    praticaGuiada: [
      'Antes de comer (agora ou na próxima refeição), pare por um instante.',
      'Observe: o que meu corpo está sinalizando?',
      'Observe: existe uma urgência emocional forte agora?',
      'Observe: qual é o contexto (hora, o que comi antes, o que estou sentindo)?',
      'Sem julgar as respostas, só reconheça as três pistas juntas.',
    ],
    leveComVoce: 'Observar as pistas do momento é mais útil do que tentar categorizar a fome como certa ou errada.',
    fontesCientificas: ['E6', 'E7'],
  }),
  sessao({
    id: 'alimentacao-emocional-m1-s3',
    titulo: 'Check-in antes, durante e depois',
    descricaoCurta: 'Note fome, sabor, conforto, satisfação e emoção — sem números obrigatórios.',
    duracaoMinutos: 7,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Fazer um check-in simples antes, durante e depois de comer — sem escalas numéricas obrigatórias — ajuda a reconectar com a experiência de comer, prestando atenção em sabor, conforto e satisfação, além da fome.',
    praticaGuiada: [
      'Antes de comer: note como você está se sentindo, em poucas palavras.',
      'Durante a refeição: note o sabor e a sensação de conforto, sem pressa.',
      'Depois de comer: note a sensação de satisfação e qualquer emoção presente.',
      'Não é necessário usar números — palavras descritivas já bastam.',
    ],
    leveComVoce: 'Prestar atenção na experiência de comer é mais rico do que só cumprir uma tarefa.',
    fontesCientificas: ['E7', 'E6'],
  }),
]);

const AE_M2 = modulo('alimentacao-emocional-m2', 'Emoções relacionadas à alimentação', [
  sessao({
    id: 'alimentacao-emocional-m2-s1',
    titulo: 'Comer por emoção não é falha moral',
    descricaoCurta: 'Normalize a experiência sem banalizar quando ela é recorrente e traz sofrimento.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Comer em resposta a uma emoção é uma experiência humana comum, não um sinal de fraqueza ou falha moral. Ao mesmo tempo, quando isso se torna frequente e traz sofrimento real, vale a pena olhar com mais cuidado e, se necessário, buscar apoio — sem culpa, mas com atenção.',
    praticaGuiada: [
      'Pense numa vez em que você comeu por causa de uma emoção, não de fome física.',
      'Reconheça, sem julgamento: "isso é uma experiência humana comum".',
      'Se isso acontece com frequência e traz sofrimento, anote isso como algo a observar com mais cuidado ao longo da jornada.',
    ],
    leveComVoce: 'Comer por emoção às vezes acontece — isso não diz nada sobre seu caráter.',
    fontesCientificas: ['E6', 'E1'],
  }),
  sessao({
    id: 'alimentacao-emocional-m2-s2',
    titulo: 'Dar nome ao que sinto',
    descricaoCurta: 'Identifique a emoção, a necessidade por trás dela e a situação que a antecedeu.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Antes de decidir o que fazer com uma vontade de comer ligada à emoção, ajuda dar um passo atrás: identificar qual emoção está presente, que necessidade ela pode estar sinalizando, e o que aconteceu antes dela aparecer.',
    praticaGuiada: [
      'Quando notar uma vontade de comer que parece ligada à emoção, pare um momento.',
      'Nomeie a emoção presente (tédio, ansiedade, tristeza, solidão, estresse).',
      'Pergunte-se: que necessidade essa emoção pode estar sinalizando (descanso, companhia, conforto, distração)?',
      'Anote a situação que antecedeu essa emoção.',
    ],
    leveComVoce: 'Nomear a emoção e a necessidade por trás dela abre mais opções do que agir no automático.',
    fontesCientificas: ['E6', 'E9'],
  }),
  sessao({
    id: 'alimentacao-emocional-m2-s3',
    titulo: 'Adicionar opções, não proibir comida',
    descricaoCurta: 'Crie um menu de apoio que pode existir junto da escolha de comer.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'A ideia aqui não é proibir comer por emoção — é adicionar outras opções de apoio que podem existir ao lado dessa escolha, ampliando o leque de respostas disponíveis, sem tirar a comida da mesa como possibilidade legítima.',
    praticaGuiada: [
      'Pense em três formas de apoio emocional que não envolvem comida: ligar para alguém, escrever, caminhar, ouvir música, descansar.',
      'Anote essas três opções como um "menu de apoio" — não para substituir a comida obrigatoriamente, mas para ter mais escolhas disponíveis.',
      'Guarde esse menu para consultar quando quiser.',
    ],
    leveComVoce: 'Ter mais opções disponíveis é diferente de proibir uma delas.',
    fontesCientificas: ['E6', 'E9'],
  }),
]);

const AE_M3 = modulo('alimentacao-emocional-m3', 'Culpa após comer', [
  sessao({
    id: 'alimentacao-emocional-m3-s1',
    titulo: 'Comida não define caráter',
    descricaoCurta: 'Retire a linguagem moral (certo/errado, bom/mau) da alimentação.',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'É comum usar palavras como "fui má", "fui certinha", "pequei" para descrever escolhas alimentares — uma linguagem moral que transforma comida em julgamento de caráter. Retirar essa linguagem ajuda a ver a alimentação de forma mais neutra.',
    praticaGuiada: [
      'Pense numa frase que você já disse sobre si mesma depois de comer algo ("fui má", "não devia ter comido isso").',
      'Reescreva a frase de forma neutra, só descrevendo o fato: "eu comi X".',
      'Note a diferença entre as duas versões.',
    ],
    leveComVoce: 'O que você come não é um veredito sobre quem você é.',
    fontesCientificas: ['E6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m3-s2',
    titulo: 'Descrever sem atacar',
    descricaoCurta: 'Reescreva "estraguei tudo" como uma descrição factual e temporária.',
    duracaoMinutos: 6,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Frases como "estraguei tudo" tendem a ser absolutas e permanentes, mesmo quando descrevem um momento específico. Reescrevê-las de forma factual e temporária ajuda a reduzir o peso emocional desnecessário.',
    praticaGuiada: [
      'Pegue uma frase de autocrítica recente sobre comer ("estraguei tudo", "não tenho controle nenhum").',
      'Reescreva de forma factual: o que exatamente aconteceu, sem generalizar.',
      'Adicione um elemento temporário: "isso foi uma refeição/um momento, não define o resto do meu dia."',
    ],
    leveComVoce: 'Um momento específico não precisa virar uma sentença sobre o dia inteiro.',
    fontesCientificas: ['E6', 'E9'],
  }),
  sessao({
    id: 'alimentacao-emocional-m3-s3',
    titulo: 'Cuidado depois de comer',
    descricaoCurta: 'Planeje um cuidado sem jejum, exercício compensatório, vômito, laxante ou punição.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Depois de uma refeição que gerou culpa, o próximo passo saudável não é compensar ou punir o corpo — é seguir cuidando dele normalmente. Esta sessão é sobre planejar isso com clareza.',
    praticaGuiada: [
      'Pense num momento recente em que sentiu vontade de "compensar" algo que comeu.',
      'Reconheça essa vontade sem agir automaticamente sobre ela.',
      'Escolha, em vez disso, uma forma de cuidado neutro: continuar comendo normalmente ao longo do dia, descansar, seguir sua rotina de sempre.',
    ],
    leveComVoce: 'Depois de comer, o cuidado que seu corpo precisa é o mesmo de sempre — não uma compensação.',
    fontesCientificas: ['E6', 'E8'],
    avisoSeguranca:
      'Se você já usou (ou sente vontade de usar) jejum prolongado, vômito, laxantes ou exercício compensatório depois de comer, isso merece atenção de um profissional de saúde — o Rose não substitui esse acompanhamento. Veja os recursos de apoio se precisar de ajuda agora.',
  }),
]);

const AE_M4 = modulo('alimentacao-emocional-m4', 'Restrições alimentares', [
  sessao({
    id: 'alimentacao-emocional-m4-s1',
    titulo: 'O ciclo restrição, urgência e culpa',
    descricaoCurta: 'Entenda como regras rígidas podem aumentar preocupação e sensação de perda de controle.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Regras alimentares muito rígidas (proibir totalmente certos alimentos, por exemplo) podem, para muitas pessoas, aumentar a preocupação com comida e a sensação de perda de controle quando a regra é quebrada — criando um ciclo de restrição, urgência e culpa. Isso não é sobre diagnóstico, é sobre um padrão que vale a pena observar.',
    praticaGuiada: [
      'Pense se existe alguma regra alimentar rígida que você segue ou tenta seguir.',
      'Reflita: essa regra aumenta ou diminui sua preocupação com comida no geral?',
      'Sem julgar, só observe se existe um padrão de restrição seguida de urgência e depois culpa.',
    ],
    leveComVoce: 'Perceber um padrão não significa que você fez algo errado — é informação valiosa.',
    fontesCientificas: ['E6', 'E8'],
  }),
  sessao({
    id: 'alimentacao-emocional-m4-s2',
    titulo: 'As regras invisíveis da comida',
    descricaoCurta: 'Identifique "posso", "não posso", "mereço" e "preciso compensar" nos seus pensamentos.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Muitas regras alimentares são invisíveis — não estão escritas em lugar nenhum, mas moldam decisões o tempo todo através de palavras como "posso", "não posso", "mereço", "preciso compensar". Trazer essas regras à consciência é o primeiro passo para questioná-las.',
    praticaGuiada: [
      'Ao longo do dia (ou pensando no seu dia comum), note quando usa mentalmente palavras como "posso", "não posso", "mereço", "preciso compensar" em relação à comida.',
      'Anote uma ou duas dessas regras invisíveis que você identificou.',
      'Sem precisar mudar nada ainda, só reconheça que elas existem.',
    ],
    leveComVoce: 'Uma regra que você nem sabia que estava seguindo já perde um pouco de força ao ser nomeada.',
    fontesCientificas: ['E6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m4-s3',
    titulo: 'Flexibilidade com segurança',
    descricaoCurta: 'Escolha uma regra pequena para questionar, com segurança e sem pressa.',
    duracaoMinutos: 7,
    tipo: 'plano',
    entendaEm1Minuto:
      'Questionar uma regra alimentar rígida pode ser feito aos poucos, começando por algo pequeno e de baixo risco. O objetivo não é abandonar todo cuidado com a alimentação, mas ganhar mais flexibilidade onde a rigidez está causando sofrimento.',
    praticaGuiada: [
      'Escolha uma das regras invisíveis que você identificou — de preferência uma pequena, não a mais difícil.',
      'Pense num jeito pequeno de flexibilizar essa regra, no seu ritmo.',
      'Anote como você se sentiria experimentando essa flexibilidade — sem se cobrar para fazer isso imediatamente.',
    ],
    leveComVoce: 'Flexibilizar uma regra pequena, no seu tempo, já é um passo real.',
    fontesCientificas: ['E6', 'E9'],
    avisoSeguranca:
      'Se você tem um transtorno alimentar diagnosticado, uma restrição alimentar importante por motivo médico, ou não se sente segura para flexibilizar sozinha, procure orientação de um profissional de saúde antes de mudar qualquer padrão alimentar — o Rose não substitui esse acompanhamento.',
  }),
]);

const AE_M5 = modulo('alimentacao-emocional-m5', 'Compulsão alimentar', [
  sessao({
    id: 'alimentacao-emocional-m5-s1',
    titulo: 'Quando existe sensação de perda de controle',
    descricaoCurta: 'Reconheça sinais gerais, sem aplicar diagnóstico a si mesma.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Algumas pessoas vivenciam episódios com sensação de perda de controle ao comer — comer rápido, além do confortável, sentindo-se incapaz de parar. O Rose não faz diagnóstico; esta sessão só ajuda a reconhecer, em termos gerais, se essa sensação está presente na sua experiência.',
    praticaGuiada: [
      'Sem se autoavaliar com rigor clínico, pense se você já teve a sensação de comer sem conseguir parar, mesmo quando queria.',
      'Se sim, reconheça isso sem julgamento, como uma experiência que faz sentido explorar com mais cuidado.',
      'Se você sente que isso acontece com frequência, ou traz muito sofrimento, considere ver a próxima sessão sobre buscar apoio.',
    ],
    leveComVoce: 'Reconhecer essa sensação não é um rótulo — é um convite para se cuidar melhor.',
    fontesCientificas: ['E8'],
    avisoSeguranca:
      'Esta sessão não substitui uma avaliação profissional. Se você sente que perde o controle ao comer com frequência, isso merece atenção de um profissional de saúde — veja a próxima sessão para orientações sobre quando e como buscar ajuda.',
  }),
  sessao({
    id: 'alimentacao-emocional-m5-s2',
    titulo: 'Pausa para entender o impulso',
    descricaoCurta: 'Observe a onda de urgência e escolha segurança — sem atrasar comida por fome física.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Diante de um impulso forte de comer, uma pausa breve pode ajudar a observar a urgência sem agir automaticamente sobre ela — mas isso não é uma técnica para adiar comida quando existe fome física real. É importante nunca usar essa pausa como forma de restrição.',
    praticaGuiada: [
      'Se notar um impulso forte de comer que não parece ligado a fome física, pare por um momento.',
      'Respire e observe a urgência, sem julgá-la, como uma onda que sobe e pode descer.',
      'Escolha o que fazer a seguir com mais espaço — que pode incluir comer, se for isso que você decidir.',
      'Se em algum momento você perceber fome física real, coma — esta pausa nunca deve atrasar isso.',
    ],
    leveComVoce: 'Esta pausa é sobre criar espaço, nunca sobre se privar de comer quando você tem fome.',
    fontesCientificas: ['E9', 'E8'],
    avisoSeguranca:
      'Esta prática não deve ser usada para adiar ou evitar comer quando há fome física — isso pode piorar o ciclo de restrição e perda de controle. Se tiver dúvida, priorize comer e busque orientação profissional.',
  }),
  sessao({
    id: 'alimentacao-emocional-m5-s3',
    titulo: 'Quando procurar ajuda',
    descricaoCurta: 'Saiba reconhecer sinais que pedem apoio profissional.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Existem sinais que indicam que é hora de buscar apoio profissional: episódios recorrentes de perda de controle, sofrimento importante, sensação de segredo em torno da comida, comportamentos de compensação, ou impacto físico na saúde. Reconhecer esses sinais e buscar ajuda é um ato de cuidado, não de fracasso.',
    praticaGuiada: [
      'Leia os sinais: episódios frequentes de perda de controle ao comer, sofrimento significativo depois, sensação de esconder o que ou quanto come, uso de compensação (vômito, laxantes, exercício excessivo, jejum), ou qualquer impacto físico preocupante.',
      'Reconheça, sem julgamento, se algum desses sinais faz parte da sua experiência.',
      'Se fizer, considere procurar um profissional de saúde (médica, nutricionista ou psicóloga com experiência em alimentação) — e veja os recursos de apoio do Rose se precisar de ajuda para dar esse passo.',
    ],
    leveComVoce: 'Pedir ajuda profissional nunca é fracasso — é um dos cuidados mais fortes que você pode escolher.',
    fontesCientificas: ['E8'],
    avisoSeguranca:
      'Se você reconhece esses sinais na sua experiência, procure um profissional de saúde qualificado (médica, nutricionista ou psicóloga com experiência em transtornos alimentares). O Rose não diagnostica nem trata transtornos alimentares — veja também os recursos de apoio e segurança do app.',
  }),
]);

const AE_M6 = modulo('alimentacao-emocional-m6', 'Relação mais consciente com a comida', [
  sessao({
    id: 'alimentacao-emocional-m6-s1',
    titulo: 'Uma experiência sensorial',
    descricaoCurta: 'Prática opcional: observe cheiro, textura e sabor de uma pequena parte da refeição.',
    duracaoMinutos: 6,
    tipo: 'exercicio',
    entendaEm1Minuto:
      'Comer com atenção plena, mesmo que só numa pequena parte da refeição, pode trazer mais presença para a experiência de comer. É uma prática opcional — não precisa ser feita em toda refeição, nem exige perfeição.',
    praticaGuiada: [
      'Escolha um pequeno pedaço ou porção de algo que você vai comer.',
      'Antes de comer, observe o cheiro e a aparência, sem pressa.',
      'Ao comer, note a textura e o sabor, prestando atenção plena por alguns instantes.',
      'Depois disso, siga a refeição no seu ritmo normal, sem precisar manter esse nível de atenção o tempo todo.',
    ],
    leveComVoce: 'Alguns instantes de atenção plena já contam — não precisa ser a refeição inteira.',
    fontesCientificas: ['E7'],
  }),
  sessao({
    id: 'alimentacao-emocional-m6-s2',
    titulo: 'Satisfação também importa',
    descricaoCurta: 'Observe prazer, conforto e saciedade, sem exigir parar num ponto perfeito.',
    duracaoMinutos: 6,
    tipo: 'reflexao',
    entendaEm1Minuto:
      'Satisfação — o prazer e o conforto de uma refeição — é uma parte legítima de comer bem, não um luxo desnecessário. Esta sessão convida a notar isso, sem a pressão de encontrar um "ponto perfeito" de parar.',
    praticaGuiada: [
      'Na próxima refeição, note se ela está sendo satisfatória — o sabor, a companhia (se houver), o conforto.',
      'Perceba a saciedade quando ela aparecer, sem tentar cronometrar ou acertar um ponto exato.',
      'Reconheça que sentir prazer numa refeição também é cuidado, não indulgência.',
    ],
    leveComVoce: 'Satisfação faz parte de uma boa relação com a comida — não é um extra opcional.',
    fontesCientificas: ['E7', 'E6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m6-s3',
    titulo: 'Escolha consciente não é escolha perfeita',
    descricaoCurta: 'Tome uma decisão alimentar com informação e flexibilidade, sem moralização.',
    duracaoMinutos: 6,
    tipo: 'plano',
    entendaEm1Minuto:
      'Comer de forma mais consciente não significa fazer sempre a escolha "perfeita" — significa decidir com alguma informação (fome, contexto, vontade) e flexibilidade, sem carregar julgamento moral sobre o resultado.',
    praticaGuiada: [
      'Na sua próxima decisão sobre comida, pare um instante antes de decidir.',
      'Considere: fome, contexto, vontade — sem regra fixa sobre qual delas "deveria" vencer.',
      'Tome a decisão e siga em frente, sem revisitar com julgamento depois.',
    ],
    leveComVoce: 'Consciente não é sinônimo de perfeito — é sinônimo de presente.',
    fontesCientificas: ['E7', 'E6'],
  }),
]);

const AE_M7 = modulo('alimentacao-emocional-m7', 'Gatilhos e autocuidado sem punição', [
  sessao({
    id: 'alimentacao-emocional-m7-s1',
    titulo: 'Meu mapa de gatilhos',
    descricaoCurta: 'Situação, emoção, pensamento, comportamento, consequência e necessidade.',
    duracaoMinutos: 7,
    tipo: 'escrita',
    entendaEm1Minuto:
      'Um mapa completo de um gatilho — situação, emoção, pensamento, comportamento, consequência e a necessidade por trás de tudo — ajuda a enxergar o padrão inteiro, não só o momento de comer. Esse tipo de mapeamento é uma ferramenta comum em abordagens que ajudam a lidar com padrões automáticos.',
    praticaGuiada: [
      'Pense num padrão recorrente ligado à alimentação emocional.',
      'Mapeie: qual situação costuma disparar? Qual emoção surge? Qual pensamento acompanha? Qual comportamento acontece? Qual a consequência? E qual necessidade real está por trás disso tudo?',
      'Escreva o mapa completo, sem pressa.',
    ],
    leveComVoce: 'Ver o padrão inteiro, não só o momento de comer, muda a forma de lidar com ele.',
    fontesCientificas: ['E9', 'E6'],
  }),
  sessao({
    id: 'alimentacao-emocional-m7-s2',
    titulo: 'Meu plano de apoio',
    descricaoCurta: 'Crie sinais de alerta, ações seguras, contatos de apoio e critérios para buscar ajuda profissional.',
    duracaoMinutos: 8,
    tipo: 'plano',
    entendaEm1Minuto:
      'Esta sessão final da jornada reúne tudo num plano de apoio pessoal: sinais de alerta para reconhecer cedo, ações seguras para o momento, pessoas de apoio, e critérios claros para saber quando é hora de buscar ajuda profissional. Ter isso pronto ajuda mais do que decidir tudo no calor do momento.',
    praticaGuiada: [
      'Anote de um a dois sinais de alerta que costumam aparecer antes de um episódio difícil com a comida.',
      'Anote de uma a duas ações seguras que ajudam nesses momentos (pausar, respirar, ligar para alguém, se afastar da situação).',
      'Anote o nome de uma pessoa de apoio, se existir.',
      'Anote os critérios que, para você, indicariam a hora de procurar ajuda profissional (revise a sessão anterior sobre isso, se precisar).',
      'Guarde este plano — ele é seu, e pode ser revisado sempre que quiser.',
    ],
    reflexao: 'Como foi construir esse plano para si mesma?',
    leveComVoce: 'Pedir ajuda, se um dia você precisar, nunca é fracasso — é um dos passos mais corajosos que existem.',
    fontesCientificas: ['E8', 'E9'],
    avisoSeguranca:
      'Este plano é um apoio pessoal, não um substituto de acompanhamento profissional. Se você reconhece sinais de sofrimento importante, restrição, compulsão ou compensação, procure um profissional de saúde e veja os recursos de apoio do Rose.',
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
  return JORNADAS.find((jornada) => jornada.slug === slug);
}

export function contarModulos(jornada: Jornada): number {
  return jornada.modulos.length;
}

export function contarSessoes(jornada: Jornada): number {
  return jornada.modulos.reduce((total, modulo) => total + modulo.sessoes.length, 0);
}

export function listarSessoesEmOrdem(jornada: Jornada): Sessao[] {
  return jornada.modulos.flatMap((modulo) => modulo.sessoes);
}

export function buscarSessaoPorId(jornada: Jornada, sessaoId: string): Sessao | undefined {
  return listarSessoesEmOrdem(jornada).find((sessao) => sessao.id === sessaoId);
}
