/**
 * Referências científicas verificadas para as 4 Jornadas de conteúdo
 * psicoeducativo (Imagem corporal, Autocompaixão, Comparação, Alimentação
 * emocional).
 *
 * Cada entrada foi verificada individualmente a partir da fonte original
 * (PubMed/NCBI, NICE ou American Psychiatric Association) antes de ser
 * incluída aqui — título, autoria, periódico/instituição e ano conferidos,
 * não apenas assumidos. Os resumos em `resumoSimples` são reescritos em
 * português, com linguagem própria, a partir do resumo/abstract original —
 * nunca copiados literalmente.
 *
 * Nenhuma sessão desta jornada substitui avaliação ou tratamento
 * profissional. Ver `limitacoes` em cada entrada para o alcance real de
 * cada estudo — nenhum resultado aqui é tratado como "comprovado",
 * "garantido" ou universal.
 */

export type IdReferenciaCientifica =
  | 'IC1'
  | 'IC2'
  | 'IC3'
  | 'IC4'
  | 'IC5'
  | 'IC6'
  | 'IC7'
  | 'IC8'
  | 'IC9'
  | 'AC1'
  | 'AC2'
  | 'AC3'
  | 'AC4'
  | 'AC5'
  | 'AC6'
  | 'AC7'
  | 'CO1'
  | 'CO2'
  | 'CO3'
  | 'CO4'
  | 'CO5'
  | 'CO6'
  | 'CO7'
  | 'AL1'
  | 'AL2'
  | 'AL3'
  | 'AL4'
  | 'AL5'
  | 'AL6'
  | 'AL7'
  | 'AL8';

export interface ReferenciaCientifica {
  id: IdReferenciaCientifica;
  titulo: string;
  autoresOuInstituicao: string;
  link: string;
  resumoSimples: string;
  sustenta: string;
  limitacoes: string;
  tipoEstudo:
    | 'ensaio clínico'
    | 'estudo experimental breve'
    | 'estudo observacional'
    | 'revisão sistemática'
    | 'meta-análise'
    | 'diretriz clínica';
}

export const REFERENCIAS: Record<IdReferenciaCientifica, ReferenciaCientifica> = {
  // ---------------------------------------------------------------------
  // Imagem corporal
  // ---------------------------------------------------------------------
  IC1: {
    id: 'IC1',
    titulo:
      'Expand Your Horizon: A programme that improves body image and reduces self-objectification by training women to focus on body functionality',
    autoresOuInstituicao: 'Alleva JM, Martijn C, Van Breukelen GJ, Jansen A, Karos K — Body Image (2015)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/26280376/',
    resumoSimples:
      'Um grupo de 81 mulheres com insatisfação corporal participou de exercícios curtos de escrita voltados a reconhecer o que o próprio corpo é capaz de fazer, em vez de focar apenas na aparência. Comparadas a um grupo controle ativo, as participantes que fizeram os exercícios relataram, em três momentos de avaliação, mais satisfação com a aparência, mais satisfação com a funcionalidade do corpo e menos tendência a se avaliar como um objeto a partir da própria aparência. Os efeitos encontrados foram de tamanho pequeno a moderado.',
    sustenta:
      'prática de notar funções do corpo (o que ele permite fazer) em vez de avaliar aparência, como alternativa à autocrítica corporal',
    limitacoes:
      'Amostra pequena (81 mulheres), população específica (mulheres com insatisfação corporal em contexto ocidental), efeitos de tamanho pequeno a moderado e sem informação clara sobre acompanhamento de longo prazo nesta publicação inicial.',
    tipoEstudo: 'estudo experimental breve',
  },
  IC2: {
    id: 'IC2',
    titulo:
      'A randomised-controlled trial investigating potential underlying mechanisms of a functionality-based approach to improving women\'s body image',
    autoresOuInstituicao:
      'Alleva JM, Diedrichs PC, Halliwell E, Martijn C, Stuijfzand BG, Treneman-Evans G, Rumsey N — Body Image (2018)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/29522927/',
    resumoSimples:
      'Este estudo repetiu, com uma amostra maior (261 mulheres britânicas de 18 a 30 anos), o exercício de escrita sobre funcionalidade do corpo testado anteriormente. As participantes foram divididas aleatoriamente entre o programa e um grupo controle, e acompanhadas por até um mês. Quem fez o programa manteve melhoras em satisfação com a aparência, satisfação com a funcionalidade do corpo e apreciação corporal tanto logo depois quanto um mês depois, mesmo diante de exposição a imagens de beleza idealizada.',
    sustenta:
      'evidência de que o efeito de notar a funcionalidade do corpo pode durar até cerca de um mês após a prática, não apenas no momento do exercício',
    limitacoes:
      'Amostra composta só por mulheres britânicas jovens que já queriam melhorar a imagem corporal; acompanhamento limitado a um mês, sem dado sobre efeitos mais duradouros.',
    tipoEstudo: 'ensaio clínico',
  },
  IC3: {
    id: 'IC3',
    titulo: 'The effect of Instagram "likes" on women\'s social comparison and body dissatisfaction',
    autoresOuInstituicao: 'Tiggemann M, Hayden S, Brown Z, Veldhuis J — Body Image (2018)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/30036748/',
    resumoSimples:
      'Pesquisadoras mostraram, a 220 universitárias, imagens em estilo Instagram de pessoas magras ou de peso médio, com poucas ou muitas curtidas simuladas. A exposição a imagens de corpos idealizados aumentou a insatisfação com o corpo e com o rosto, independentemente do número de curtidas. Já o número de curtidas por si só afetou mais a insatisfação com o rosto do que com o corpo, e esse efeito foi mais forte em quem valoriza receber curtidas.',
    sustenta:
      'explicação sobre como imagens idealizadas nas redes (não apenas o número de curtidas) influenciam a comparação de aparência',
    limitacoes:
      'Estudo de laboratório de curta duração, com estímulos simulados (não o feed real das participantes); amostra de universitárias, o que limita a generalização para outras idades e contextos.',
    tipoEstudo: 'estudo experimental breve',
  },
  IC4: {
    id: 'IC4',
    titulo:
      'TikTok on the clock but the #fitspo don\'t stop: The impact of TikTok fitspiration videos on women\'s body image concerns',
    autoresOuInstituicao: 'Pryde S, Prichard I — Body Image (2022)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/36194987/',
    resumoSimples:
      'Neste estudo, 120 mulheres australianas de 18 a 25 anos assistiram, de forma aleatória, a vídeos de "fitspiration" (conteúdo de exercício/corpo "sarado") ou a vídeos de arte no TikTok. Quem assistiu aos vídeos de fitspiration relatou mais comparação de aparência e piora de humor do que quem assistiu aos vídeos de arte, embora a insatisfação corporal não tenha aumentado de forma direta. O fator que ligou a exposição aos vídeos à insatisfação e à piora de humor foi justamente a comparação de aparência feita no momento.',
    sustenta:
      'explicação sobre por que certos vídeos de "fitspiration"/exercício podem afetar o humor mesmo sem mudar a insatisfação corporal diretamente — via comparação de aparência',
    limitacoes:
      'Estudo de curta duração em laboratório, com uma única exposição; amostra jovem e de um único país, sem acompanhamento de efeitos a médio ou longo prazo.',
    tipoEstudo: 'estudo experimental breve',
  },
  IC5: {
    id: 'IC5',
    titulo: 'School-Based Interventions Improve Body Image and Media Literacy in Youth: A Systematic Review and Meta-Analysis',
    autoresOuInstituicao: 'Kurz M, Rosendahl J, Rodeck J, Muehleck J, Berger U — Journal of Prevention (2022)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/34962632/',
    resumoSimples:
      'Uma revisão reuniu 17 avaliações de programas escolares sobre alfabetização midiática (ensinar a questionar criticamente imagens e mensagens da mídia), somando mais de 7 mil estudantes de 10 a 15 anos. No conjunto, os programas que trabalharam alfabetização midiática — em especial os baseados no princípio de "dissonância" entre o ideal de beleza e a realidade — estiveram associados a melhora na imagem corporal e no pensamento crítico sobre mídia, embora os resultados tenham variado bastante entre os estudos.',
    sustenta:
      'base para explicar o que é alfabetização/leitura crítica de mídia e por que ela pode ajudar a lidar com imagens idealizadas',
    limitacoes:
      'Heterogeneidade importante entre os estudos incluídos (populações, programas e formas de medir os resultados diferentes); efeito médio, não garantido para cada pessoa ou programa individualmente.',
    // Classificada como meta-análise (não apenas revisão sistemática) porque a publicação calcula um efeito agregado entre os 17 estudos incluídos.
    tipoEstudo: 'meta-análise',
  },
  IC6: {
    id: 'IC6',
    titulo:
      'Out of the loop: Taking a one-week break from social media leads to better self-esteem and body image among young women',
    autoresOuInstituicao: 'Smith OE, Mills JS, Samson L — Body Image (2024)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38692094/',
    resumoSimples:
      'Sessenta e seis universitárias foram divididas em dois grupos: um pausou o uso de redes sociais por sete dias e o outro manteve o uso normal. Quem fez a pausa relatou ganhos em autoestima (em diferentes aspectos) e em satisfação corporal em comparação ao grupo que manteve o uso habitual, sendo que mulheres que internalizavam mais o ideal de corpo magro tiveram ganhos ainda maiores em satisfação corporal.',
    sustenta:
      'ideia de uma pausa curta (cerca de uma semana) das redes sociais como benefício de curto prazo para autoestima e satisfação corporal — não como mudança permanente automática',
    limitacoes:
      'Amostra pequena (66 mulheres) e específica (universitárias); a pausa durou apenas uma semana, então o estudo não mostra se o benefício se mantém depois que as redes voltam a ser usadas.',
    tipoEstudo: 'ensaio clínico',
  },
  IC7: {
    id: 'IC7',
    titulo: 'Brief self-compassion meditation training for body image distress in young adult women',
    autoresOuInstituicao: 'Toole AM, Craighead LW — Body Image (2016)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/27664531/',
    resumoSimples:
      'Oitenta universitárias com preocupação com a imagem corporal foram divididas entre um treino curto (uma semana) de meditação com foco em autocompaixão, feito pela internet, e um grupo de espera. As participantes que fizeram o treino relataram melhora em aspectos de autocompaixão e em sofrimento relacionado à imagem corporal, embora a adesão à prática diária durante a semana tenha sido menor do que o esperado.',
    sustenta:
      'base para práticas breves de autocompaixão como forma de amenizar o sofrimento ligado à imagem corporal, sem prometer resolução completa',
    limitacoes:
      'Intervenção muito curta (uma semana) e adesão baixa às práticas diárias durante o estudo; amostra pequena de universitárias, sem grupo controle ativo (comparação foi com lista de espera).',
    tipoEstudo: 'ensaio clínico',
  },
  IC8: {
    id: 'IC8',
    titulo:
      'Protecting young women\'s body image from appearance-based social media exposure: A comparative study of self-compassion writing and mindful breathing interventions',
    autoresOuInstituicao: 'Li E, Cheng W, Yuan H, Gao X — Journal of Psychosomatic Research (2025)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/40203687/',
    resumoSimples:
      'Cento e sete jovens mulheres viram imagens de corpos idealizados e, em seguida, foram divididas entre escrever um texto autocompassivo, fazer respiração consciente ou nenhuma das duas coisas (controle). A escrita autocompassiva foi a que mais ajudou a recuperar a satisfação com o corpo depois da exposição às imagens, sobretudo entre quem tende a se autoavaliar mais pela aparência.',
    sustenta:
      'prática de escrita autocompassiva como forma de amenizar o impacto imediato de ver imagens idealizadas nas redes',
    limitacoes:
      'Efeito medido em uma única sessão de laboratório, sem avaliação de duração além do momento imediato; amostra jovem e não representativa de todas as mulheres.',
    tipoEstudo: 'estudo experimental breve',
  },
  IC9: {
    id: 'IC9',
    titulo:
      'Combating weight-stigmatization in online spaces: the impacts of body neutral, body positive, and weight-stigmatizing TikTok content on body image and mood',
    autoresOuInstituicao: 'Kilby R, Mickelson KD — Frontiers in Psychiatry (2025)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/40557133/',
    resumoSimples:
      'Trezentas e vinte e seis pessoas (mulheres e pessoas de gênero diverso) assistiram a compilações de vídeos do TikTok classificados como neutralidade corporal, positividade corporal ou conteúdo que estigmatiza o peso. Tanto o conteúdo de positividade quanto o de neutralidade corporal estiveram associados a menos autoavaliação pela aparência, menos insatisfação corporal e menos afeto negativo do que o conteúdo estigmatizante — sendo que a neutralidade corporal se destacou especialmente na redução da autoavaliação pela aparência, e a positividade corporal no aumento de afeto positivo.',
    sustenta:
      'ideia de que conteúdo de neutralidade corporal é uma alternativa prática ao conteúdo que estigmatiza peso — apresentada como evidência inicial associativa, não como tratamento validado',
    limitacoes:
      'Estudo muito recente com poucas replicações até o momento; delineamento de exposição breve a vídeos, sem medir efeitos de uso continuado de redes sociais ao longo do tempo.',
    tipoEstudo: 'estudo experimental breve',
  },

  // ---------------------------------------------------------------------
  // Autocompaixão
  // ---------------------------------------------------------------------
  AC1: {
    id: 'AC1',
    titulo: 'Self-Compassion: Theory, Method, Research, and Intervention',
    autoresOuInstituicao: 'Neff KD — Annual Review of Psychology (2023)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/35961039/',
    resumoSimples:
      'Uma revisão do campo de pesquisa sobre autocompaixão descreve o conceito como formado por seis elementos, organizados em três pares: mais gentileza consigo mesma (em vez de autojulgamento), reconhecimento de que sofrer e falhar faz parte da experiência humana compartilhada (em vez de se sentir isolada) e atenção plena ao próprio sofrimento (em vez de se identificar demais com ele, ficando "presa" na dor). A revisão também discute mal-entendidos comuns, como a ideia equivocada de que autocompaixão significa fraqueza, egoísmo ou falta de exigência consigo mesma.',
    sustenta:
      'definição central de autocompaixão em três elementos (gentileza, humanidade compartilhada, atenção plena) usada como base conceitual da jornada',
    limitacoes:
      'Revisão ampla do campo, publicada em periódico de revisões convidadas (Annual Review of Psychology), que sintetiza estudos de metodologias e populações variadas (validação de escala, estudos correlacionais, ensaios de intervenção) sem apresentar um efeito agregado único, diferente do que faz uma meta-análise.',
    tipoEstudo: 'revisão sistemática',
  },
  AC2: {
    id: 'AC2',
    titulo:
      'Effectiveness of self-compassion-related interventions for reducing self-criticism: A systematic review and meta-analysis',
    autoresOuInstituicao: 'Wakelin KE, Perman G, Simonds LM — Clinical Psychology & Psychotherapy (2022)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/33749936/',
    resumoSimples:
      'Uma revisão reuniu 20 estudos controlados e randomizados (com dados de 19 deles, totalizando 1.350 pessoas) que testaram intervenções de autocompaixão para reduzir a autocrítica. No conjunto, essas intervenções mostraram uma redução moderada e estatisticamente significativa da autocrítica em comparação a grupos controle, com efeitos maiores em programas mais longos e comparados a grupos que não recebiam nenhuma intervenção ativa.',
    sustenta:
      'base para a afirmação de que práticas de autocompaixão estão associadas, em conjunto de estudos, a redução da autocrítica — não a eliminação dela',
    limitacoes:
      'Qualidade metodológica dos estudos incluídos foi, em média, apenas moderada; efeitos variaram bastante entre estudos, e muitos usaram grupo controle passivo (sem intervenção alternativa), o que tende a inflar o efeito aparente.',
    // Classificada como meta-análise (não apenas revisão sistemática) porque a publicação calcula um efeito agregado entre os 19 estudos analisados quantitativamente.
    tipoEstudo: 'meta-análise',
  },
  AC3: {
    id: 'AC3',
    titulo: 'A pilot study and randomized controlled trial of the mindful self-compassion program',
    autoresOuInstituicao: 'Neff KD, Germer CK — Journal of Clinical Psychology (2013)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/23070875/',
    resumoSimples:
      'Este estudo testou o programa Mindful Self-Compassion, de 8 semanas, primeiro em um piloto com 21 pessoas da comunidade e depois em um ensaio comparando 25 participantes do programa a 27 pessoas em lista de espera. Quem participou do programa apresentou aumentos significativos em autocompaixão, atenção plena e bem-estar em geral, com ganhos que se mantiveram em avaliações de seis meses e um ano depois.',
    sustenta:
      'evidência de que um programa estruturado e mais longo (8 semanas) de autocompaixão pode gerar ganhos duradouros — usado para deixar claro que uma sessão de 5 a 8 minutos não equivale a esse tipo de programa',
    limitacoes:
      'Amostras pequenas (21 no piloto, 52 no ensaio controlado); grupo controle foi lista de espera passiva, não uma intervenção alternativa ativa; programa completo dura 8 semanas, bem mais longo que uma única sessão breve.',
    tipoEstudo: 'ensaio clínico',
  },
  AC4: {
    id: 'AC4',
    titulo: 'An Internet-Based Compassion-Focused Intervention for Increased Self-Criticism: A Randomized Controlled Trial',
    autoresOuInstituicao: 'Krieger T, Reber F, von Glutz B, Urech A, Moser CT, Schulz A, Berger T — Behavior Therapy (2019)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/30824257/',
    resumoSimples:
      'Cento e vinte e duas pessoas com autocrítica elevada foram divididas entre cuidado habitual e cuidado habitual mais um programa on-line de foco compassivo, com orientação sob demanda. Depois de 8 semanas, o grupo que recebeu o programa apresentou melhora significativamente maior em sintomas depressivos, de ansiedade e sofrimento geral, além de mais autocompaixão, com efeitos que se mantiveram seis meses depois.',
    sustenta:
      'evidência de que um programa on-line estruturado de foco compassivo pode reduzir autocrítica e sintomas de sofrimento emocional ao longo de semanas — contexto usado para não prometer o mesmo resultado em uma sessão isolada',
    limitacoes:
      'Participantes se autosselecionaram para o estudo (não foram recrutados de forma aleatória na população); grupo controle recebeu apenas cuidado habitual, sem outra intervenção ativa equivalente em tempo e atenção.',
    tipoEstudo: 'ensaio clínico',
  },
  AC5: {
    id: 'AC5',
    titulo:
      'Treating perfectionism via the Internet: a randomized controlled trial comparing cognitive behavior therapy to unified protocol',
    autoresOuInstituicao:
      'Rozental A, Shafran R, Johansson F, Forsström D, Jovicic F, Gelberg O, Molin K, Carlbring P, Andersson G, Buhrman M — Cognitive Behaviour Therapy (2024)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38483057/',
    resumoSimples:
      'Cento e trinta e oito pessoas com perfeccionismo prejudicial participaram de um programa on-line de 8 semanas, comparando uma terapia cognitivo-comportamental específica para perfeccionismo com um protocolo unificado para regulação emocional. As duas abordagens reduziram de forma expressiva os sintomas de perfeccionismo, com ganhos mantidos ao longo do acompanhamento, sem diferença relevante entre os dois formatos.',
    sustenta:
      'evidência de que abordagens terapêuticas estruturadas de várias semanas ajudam a reduzir perfeccionismo prejudicial — base para enquadrar experimentos comportamentais pequenos e seguros como um primeiro passo, não como equivalente a um tratamento completo',
    limitacoes:
      'Amostra que buscou tratamento por conta própria (pode não representar quem nunca procuraria ajuda); intervenção de 8 semanas com apoio terapêutico, bem mais estruturada e longa do que qualquer sessão breve.',
    tipoEstudo: 'ensaio clínico',
  },
  AC6: {
    id: 'AC6',
    titulo: 'Putting feelings into words: affect labeling disrupts amygdala activity in response to affective stimuli',
    autoresOuInstituicao: 'Lieberman MD, Eisenberger NI, Crockett MJ, Tom SM, Pfeifer JH, Way BM — Psychological Science (2007)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/17576282/',
    resumoSimples:
      'Usando ressonância magnética funcional, este estudo mostrou que colocar em palavras uma emoção diante de uma imagem que provoca reação emocional está associado a uma resposta menor da amígdala (região do cérebro ligada à reação emocional intensa) do que apenas ver a imagem sem nomear o que se sente.',
    sustenta:
      'base para a prática de nomear a emoção sentida (registro de pensamento automático) como um passo que pode ajudar a diminuir a intensidade da reação emocional — não como algo que a elimina',
    limitacoes:
      'Estudo de laboratório com estímulo único e resposta imediata, não mede efeito de nomear emoções ao longo do tempo nem em situações do dia a dia fora do exame de imagem cerebral.',
    tipoEstudo: 'estudo experimental breve',
  },
  AC7: {
    id: 'AC7',
    titulo: 'A Brief Self-Compassionate Letter-Writing Intervention for Individuals with High Shame',
    autoresOuInstituicao: 'Swee MB, Klein K, Murray S, Heimberg RG — Mindfulness (2023)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37090852/',
    resumoSimples:
      'Sessenta e oito universitárias e universitários com níveis altos de vergonha foram divididos entre um programa de 16 dias de escrita de cartas autocompassivas, on-line, e um grupo de lista de espera. Quem escreveu as cartas relatou reduções de médio a grande porte em vergonha, autocrítica e ansiedade geral, com ganhos mantidos um mês depois.',
    sustenta:
      'prática de escrever uma carta autocompassiva voltada especificamente para lidar com vergonha',
    limitacoes:
      'Amostra de estudantes universitários com alta vergonha (não representa toda a população); grupo controle foi lista de espera passiva; programa durou 16 dias, mais longo que uma sessão única.',
    tipoEstudo: 'ensaio clínico',
  },

  // ---------------------------------------------------------------------
  // Comparação
  // ---------------------------------------------------------------------
  CO1: {
    id: 'CO1',
    titulo: 'Intervening on Social Comparisons on Social Media: Electronic Daily Diary Pilot Study',
    autoresOuInstituicao: 'Andrade FC, Erwin S, Burnell K, Jackson J, Storch M, Nicholas J, Zucker N — JMIR Mental Health (2023)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37115607/',
    resumoSimples:
      'Cinquenta e cinco universitárias e universitários registraram, por 14 dias, um diário eletrônico diário sobre uso de redes sociais. Na segunda metade do estudo, metade do grupo recebeu um treino breve para praticar "savoring social" — sentir alegria genuína com as conquistas de outras pessoas — em vez de comparação. Quem praticou esse treino relatou mais autoestima em dias em que praticava mais o "savoring", e o grupo todo relatou menos comparação social e mais sensação de conexão ao final do estudo.',
    sustenta:
      'prática de notar e valorizar algo positivo na vida de outra pessoa (em vez de compará-la consigo) como forma de reduzir o impacto da comparação social',
    limitacoes:
      'Estudo piloto pequeno (55 participantes), de curta duração (14 dias), sem grupo controle totalmente separado (ambos os grupos vieram da mesma amostra e período).',
    tipoEstudo: 'estudo experimental breve',
  },
  CO2: {
    id: 'CO2',
    titulo:
      'The association between social comparison in social media, body image concerns and eating disorder symptoms: A systematic review and meta-analysis',
    autoresOuInstituicao: 'Bonfanti RC, Melchiori F, Teti A, Albano G, Raffard S, Rodgers R, Lo Coco G — Body Image (2025)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/39721448/',
    resumoSimples:
      'Uma revisão reuniu 83 estudos, com mais de 55 mil participantes, sobre a relação entre comparação social nas redes e imagem corporal/sintomas alimentares. No conjunto, quanto maior a tendência a se comparar nas redes, maior a associação com preocupação com a imagem corporal, sintomas alimentares e menor autoavaliação positiva — associação de tamanho moderado, que variou conforme o tipo de rede social e o tipo de comparação feita.',
    sustenta:
      'base para explicar, de forma associativa (não causal), por que comparação de aparência nas redes está ligada a mais insatisfação corporal',
    limitacoes:
      'A maioria dos estudos incluídos é observacional/correlacional, então a revisão não comprova que a comparação causa os sintomas — pode haver influência nos dois sentidos.',
    // Classificada como meta-análise (não apenas revisão sistemática) porque a publicação calcula correlações agregadas (r) entre os 83 estudos incluídos.
    tipoEstudo: 'meta-análise',
  },
  CO3: {
    id: 'CO3',
    titulo:
      'Using Social Media for Social Comparison and Feedback-Seeking: Gender and Popularity Moderate Associations with Depressive Symptoms',
    autoresOuInstituicao: 'Nesi J, Prinstein MJ — Journal of Abnormal Child Psychology (2015)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/25899879/',
    resumoSimples:
      'Seiscentos e dezenove adolescentes (57% meninas) responderam questionários em dois momentos sobre uso de redes sociais para comparação e busca de validação (curtidas/comentários), além de sintomas depressivos. Usar as redes dessa forma esteve associado a mais sintomas depressivos, principalmente entre meninas e entre adolescentes com menos popularidade — mesmo descontando o tempo total de uso das redes.',
    sustenta:
      'base para explicar a diferença entre usar redes sociais em geral e usá-las especificamente para buscar validação/comparação, e por que esse segundo padrão está mais associado a sofrimento',
    limitacoes:
      'Estudo correlacional com adolescentes, não prova causalidade; dados de autorrelato sobre uso e sintomas, que pode não refletir o comportamento real com precisão.',
    tipoEstudo: 'estudo observacional',
  },
  CO4: {
    id: 'CO4',
    titulo:
      'Reassurance seeking in the anxiety disorders and OCD: Construct validation, clinical correlates and CBT treatment response',
    autoresOuInstituicao: 'Rector NA, Katz DE, Quilty LC, Laposa JM, Collimore K, Kay T — Journal of Anxiety Disorders (2019)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/31430610/',
    resumoSimples:
      'Setecentos e trinta e oito pacientes em tratamento para transtornos de ansiedade ou TOC responderam a uma escala sobre busca de reafirmação (pedir repetidamente aprovação, segurança ou confirmação a outras pessoas). O estudo identificou três padrões desse comportamento e mostrou que ele diminuiu após terapia cognitivo-comportamental, e que essa redução acompanhou a melhora clínica geral.',
    sustenta:
      'explicação sobre o que é busca excessiva de reafirmação/validação e por que, quando repetitiva e rígida, tende a estar associada a mais sofrimento — não a busca pontual de apoio, que é normal',
    limitacoes:
      'Amostra clínica de pessoas em tratamento para ansiedade/TOC, não a população em geral — o padrão pode se manifestar de forma mais leve fora de um contexto clínico.',
    tipoEstudo: 'estudo observacional',
  },
  CO5: {
    id: 'CO5',
    titulo: 'Authenticity, life satisfaction, and distress: a longitudinal analysis',
    autoresOuInstituicao: 'Boyraz G, Waits JB, Felix VA — Journal of Counseling Psychology (2014)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/25019552/',
    resumoSimples:
      'Duzentos e trinta e dois universitários responderam questionários sobre autenticidade (agir de acordo com os próprios valores e sentimentos), satisfação com a vida e sofrimento psicológico, em dois momentos. Níveis mais altos de autenticidade no primeiro momento anteciparam mais satisfação com a vida e menos sofrimento no segundo momento — a relação inversa (sofrimento afetando autenticidade depois) não foi tão clara.',
    sustenta:
      'base associativa para a ideia de que agir de forma mais autêntica está ligado a mais bem-estar ao longo do tempo — sem tratar isso como obrigação de revelar tudo sobre si',
    limitacoes:
      'Estudo correlacional (ainda que longitudinal) com apenas dois momentos de coleta, amostra de universitários de duas universidades, o que limita a generalização.',
    tipoEstudo: 'estudo observacional',
  },
  CO6: {
    id: 'CO6',
    titulo: 'Positive psychology progress: empirical validation of interventions',
    autoresOuInstituicao: 'Seligman MEP, Steen TA, Park N, Peterson C — American Psychologist (2005)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/16045394/',
    resumoSimples:
      'Este estudo testou, pela internet e com atribuição aleatória a 6 grupos (incluindo um grupo controle), diferentes exercícios de psicologia positiva — entre eles, um exercício de identificar e usar as próprias forças/qualidades pessoais de um jeito novo. Três dos exercícios testados aumentaram a felicidade e reduziram sintomas depressivos de forma duradoura, entre eles o de reconhecimento das próprias forças.',
    sustenta:
      'prática de reconhecer qualidades/forças pessoais concretas como exercício associado a mais bem-estar — a ser feito com evidências reais, não afirmações genéricas',
    limitacoes:
      'Estudo pela internet com autosseleção de participantes (pessoas interessadas em psicologia positiva); efeitos de "durabilidade" comparam poucos meses, não anos.',
    tipoEstudo: 'ensaio clínico',
  },
  CO7: {
    id: 'CO7',
    titulo:
      'A meta-analysis of the efficacy of acceptance and commitment therapy for clinically relevant mental and physical health problems',
    autoresOuInstituicao: 'A-Tjak JGL, Davis ML, Morina N, Powers MB, Smits JAJ, Emmelkamp PMG — Psychotherapy and Psychosomatics (2015)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/25547522/',
    resumoSimples:
      'Uma meta-análise reuniu 39 ensaios clínicos randomizados (1.821 participantes) sobre a Terapia de Aceitação e Compromisso (ACT), abordagem que trabalha aceitação de pensamentos/emoções difíceis e ação orientada por valores pessoais. A ACT teve desempenho melhor do que lista de espera, placebo e cuidado padrão, com resultados comparáveis aos da terapia cognitivo-comportamental tradicional.',
    sustenta:
      'base teórica para exercícios de agir de acordo com valores pessoais mesmo diante de comparação ou insegurança, em vez de esperar a insegurança desaparecer primeiro',
    limitacoes:
      'Meta-análise de estudos com condições clínicas variadas (ansiedade, depressão, dor crônica etc.), não específica sobre comparação social; tamanhos de efeito moderados, não universais.',
    tipoEstudo: 'meta-análise',
  },

  // ---------------------------------------------------------------------
  // Alimentação emocional
  // ---------------------------------------------------------------------
  AL1: {
    id: 'AL1',
    titulo: 'Dissonance-based eating disorder prevention improves intuitive eating: a randomized controlled trial for Brazilian women with body dissatisfaction',
    autoresOuInstituicao: 'Resende TRO, Almeida M, Dos Santos Alvarenga M, Brown TA, de Carvalho PHB — Eating and Weight Disorders (2022)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/34143404/',
    resumoSimples:
      'Setenta e quatro mulheres brasileiras com insatisfação corporal foram divididas entre um programa de 4 sessões baseado em "dissonância" (questionar ativamente o ideal de beleza magro) — que incluía exemplos de alimentação intuitiva — e um grupo apenas avaliado, sem intervenção. O grupo do programa apresentou mais aumento em alimentação intuitiva, apreciação corporal e autoestima, e mais redução em internalização do ideal de beleza, insatisfação corporal e comportamento alimentar desregrado, com ganhos que persistiram até 24 semanas depois.',
    sustenta:
      'evidência brasileira de que um programa estruturado (várias sessões) pode aumentar alimentação intuitiva e reduzir comportamento alimentar desregrado — não uma sessão isolada',
    limitacoes:
      'Amostra pequena (74 mulheres) e específica (mulheres brasileiras com insatisfação corporal, a maioria provavelmente estudantes); grupo controle foi apenas avaliação, sem outra intervenção ativa equivalente.',
    tipoEstudo: 'ensaio clínico',
  },
  AL2: {
    id: 'AL2',
    titulo:
      'Development and efficacy of a cognitive dissonance-based intervention program for intuitive eating: A randomized controlled clinical trial',
    autoresOuInstituicao: 'Resende TRO, Dos Santos Alvarenga M, de Carvalho PHB — Body Image (2026)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/42259168/',
    resumoSimples:
      'Cento e dez mulheres brasileiras de 18 a 35 anos foram divididas aleatoriamente entre um programa de dissonância cognitiva, um programa educativo ou um grupo controle, com avaliações até 48 semanas depois. O grupo de dissonância cognitiva apresentou aumento em apreciação corporal, orientação para sinais internos de fome/saciedade e motivação para atividade física por saúde, além de redução em alimentação restritiva, com diferenças que se mantiveram nas avaliações de acompanhamento mais longas.',
    sustenta:
      'reforço, com amostra brasileira mais recente, de que programas estruturados de várias sessões ajudam a reduzir alimentação restritiva e aumentar orientação por sinais internos de fome',
    limitacoes:
      'Estudo muito recente, ainda com poucas replicações independentes; amostra de mulheres brasileiras de uma faixa etária específica, sem garantia de que o resultado se repita em outras populações.',
    tipoEstudo: 'ensaio clínico',
  },
  AL3: {
    id: 'AL3',
    titulo:
      'Mindfulness-Based Eating Solution (MBES) for Body Dissatisfaction and Disordered Eating Attitudes in Nutrition Students During the COVID-19 Pandemic: A Randomised Clinical Trial',
    autoresOuInstituicao: 'Silva TA, Flôres AT, Buttros TS, Motarelli JHF, Pena GDG, Penaforte FRO, Japur CC — Journal of Human Nutrition and Dietetics (2025)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/40091515/',
    resumoSimples:
      'Setenta e oito estudantes de nutrição (mulheres) foram divididas entre um programa de alimentação baseado em atenção plena, com 11 encontros semanais, e um grupo controle. Quem participou do programa apresentou redução em insatisfação corporal e em atitudes alimentares problemáticas, além de melhora na percepção de sinais de fome e em atenção plena, com ganhos mantidos até três meses depois; o grupo controle não teve melhora equivalente.',
    sustenta:
      'evidência de que práticas de alimentação com atenção plena, sustentadas ao longo de semanas, estão associadas a menos atitudes alimentares problemáticas e mais percepção dos sinais de fome',
    limitacoes:
      'Amostra específica (estudantes de nutrição, grupo com risco conhecido de atitudes alimentares problemáticas) e pequena (78 mulheres); programa de 11 semanas, bem mais longo que qualquer sessão breve.',
    tipoEstudo: 'ensaio clínico',
  },
  AL4: {
    id: 'AL4',
    titulo: 'Binge eating as emotion regulation? A meta-analysis of ecological momentary assessment studies',
    autoresOuInstituicao: 'Borm IM, Hartmann S, Barnow S, Pruessner L — Clinical Psychology Review (2025)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/40768884/',
    resumoSimples:
      'Uma meta-análise reuniu 42 estudos (1.745 participantes) que registraram, no dia a dia via aplicativo, as emoções de pessoas antes e depois de episódios de compulsão alimentar. Os dados mostraram de forma consistente que as emoções pioram antes do episódio de compulsão, apoiando a ideia de que o sofrimento emocional pode desencadear a compulsão; já os resultados sobre o que acontece depois do episódio foram mistos, com alguma melhora emocional passageira em certas análises, mas piora geral em outras.',
    sustenta:
      'explicação sobre o padrão emoção-antes/depois da compulsão alimentar, usada para descrever o ciclo sem prometer que "identificar a emoção" elimina a compulsão',
    limitacoes:
      'Heterogeneidade importante entre os estudos incluídos, sem explicação clara para essa variação; dados de autorrelato momento a momento, que dependem de as pessoas registrarem corretamente o que sentem.',
    tipoEstudo: 'meta-análise',
  },
  AL5: {
    id: 'AL5',
    titulo: 'Fasting increases risk for onset of binge eating and bulimic pathology: a 5-year prospective study',
    autoresOuInstituicao: 'Stice E, Davis K, Miller NP, Marti CN — Journal of Abnormal Psychology (2008)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/19025239/',
    resumoSimples:
      'Quatrocentas e noventa e seis adolescentes foram acompanhadas por cinco anos. Entre as várias formas de restrição alimentar avaliadas, o jejum (passar longos períodos sem comer) foi a que mais previu, de forma consistente, o surgimento posterior de compulsão alimentar recorrente e de sintomas de bulimia — mais até do que a restrição alimentar avaliada de forma geral.',
    sustenta:
      'base para não recomendar jejum prolongado como estratégia e para explicar, com cautela profissional, por que restrição alimentar severa pode aumentar risco de compulsão mais adiante',
    limitacoes:
      'Estudo observacional (não experimental) só com adolescentes do sexo feminino; mostra associação e ordem temporal, mas não isola o jejum de outros fatores de risco presentes na vida dessas adolescentes.',
    tipoEstudo: 'estudo observacional',
  },
  AL6: {
    id: 'AL6',
    titulo: 'Mindfulness meditation as an intervention for binge eating, emotional eating, and weight loss: a systematic review',
    autoresOuInstituicao: 'Katterman SN, Kleinman BM, Hood MM, Nackers LM, Corsica JA — Eating Behaviors (2014)',
    link: 'https://pubmed.ncbi.nlm.nih.gov/24854804/',
    resumoSimples:
      'Uma revisão sistemática reuniu 14 estudos que testaram meditação com atenção plena para compulsão alimentar e alimentação emocional. No conjunto, a meditação esteve associada a redução de compulsão alimentar e de alimentação emocional em pessoas que já apresentavam esses comportamentos; os resultados sobre efeito no peso corporal foram inconsistentes entre os estudos.',
    sustenta:
      'base para práticas de atenção plena como forma de lidar com o impulso de comer em resposta a emoções — sem associar a prática a perda de peso',
    limitacoes:
      'Poucos estudos incluídos (14), com metodologias e formas de medir "atenção plena" variadas; a revisão não avalia se o efeito se mantém a longo prazo.',
    tipoEstudo: 'revisão sistemática',
  },
  AL7: {
    id: 'AL7',
    titulo: 'Eating disorders: recognition and treatment (NICE guideline NG69)',
    autoresOuInstituicao: 'National Institute for Health and Care Excellence (NICE), Reino Unido — publicada em 2017, atualizada em 2020',
    link: 'https://www.nice.org.uk/guidance/ng69',
    resumoSimples:
      'Esta é uma diretriz clínica oficial do NICE (órgão britânico de saúde) sobre reconhecimento e tratamento de transtornos alimentares (anorexia nervosa, transtorno da compulsão alimentar periódica, bulimia nervosa e outros quadros alimentares e nutricionais especificados) em crianças, adolescentes e adultos. Ela recomenda intervenção precoce por serviços especializados, orienta sobre avaliação, tratamento, monitoramento e cuidado hospitalar quando necessário, e destaca a importância de envolver família e rede de apoio no processo de recuperação.',
    sustenta:
      'base para os critérios de quando um sinal (perda de controle, restrição, compensação, entre outros) indica necessidade de buscar avaliação profissional especializada, e para os avisos de segurança da jornada',
    limitacoes:
      'Diretriz elaborada para o sistema de saúde do Reino Unido, com base em revisões de evidência daquele contexto; não cobre todos os quadros alimentares (por exemplo, não inclui transtorno alimentar restritivo/evitativo).',
    tipoEstudo: 'diretriz clínica',
  },
  AL8: {
    id: 'AL8',
    titulo: 'The American Psychiatric Association Practice Guideline for the Treatment of Patients With Eating Disorders',
    autoresOuInstituicao: 'American Psychiatric Association — American Journal of Psychiatry (2023)',
    link: 'https://psychiatryonline.org/doi/10.1176/appi.ajp.23180001',
    resumoSimples:
      'Esta diretriz clínica da Associação Americana de Psiquiatria reúne recomendações para avaliação e tratamento (psicoterapia, tratamentos não farmacológicos e, quando indicado, medicação) de transtornos alimentares definidos pelo DSM-5-TR, substituindo a versão anterior de 2006. Ela reforça a importância de avaliação profissional individualizada e de tratamento baseado em evidências para quadros como anorexia, bulimia e transtorno da compulsão alimentar periódica.',
    sustenta:
      'reforço adicional, junto com a diretriz do NICE, de que sinais de transtorno alimentar (restrição severa, compulsão, comportamento compensatório) pedem avaliação profissional especializada e não devem ser tratados apenas com conteúdo educativo',
    limitacoes:
      'Diretriz voltada ao contexto clínico dos Estados Unidos, elaborada para orientar profissionais de saúde mental, não para uso autônomo por leigos como substituto de avaliação profissional.',
    tipoEstudo: 'diretriz clínica',
  },
};

export function buscarReferencia(id: IdReferenciaCientifica): ReferenciaCientifica {
  return REFERENCIAS[id];
}
