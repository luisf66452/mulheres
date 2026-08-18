// Catálogo de recompensas do Clube Rose — só conteúdo editorial (texto de
// apresentação). Custo, estoque, status ('ativa'/'pausada'/'futura') e se
// exige Pro vivem em recompensas_catalogo (banco, migração 0014): são dados
// de segurança/operação que uma administradora precisa poder mudar sem
// deploy, e que a RPC resgatar_recompensa lê como fonte autoritativa. NÃO
// alterar os textos aqui sem autorização explícita do usuário (mesma regra
// de VALORES_PETALAS), e manter as `chave` sincronizadas com o banco.
export interface Recompensa {
  chave: string;
  nome: string;
  descricao: string;
  mensagem: string;
  tipo: 'digital' | 'personalizacao' | 'conteudo' | 'experiencia' | 'futura';
}

export const RECOMPENSAS: Recompensa[] = [
  {
    chave: 'selo_comecei_a_florescer',
    nome: 'Selo "Comecei a Florescer"',
    descricao: 'Selo especial exibido no perfil da usuária.',
    mensagem: 'Toda transformação começa com um pequeno gesto de cuidado.',
    tipo: 'digital',
  },
  {
    chave: 'moldura_floral_perfil',
    nome: 'Moldura Floral para o Perfil',
    descricao: 'Moldura exclusiva com flores delicadas ao redor da foto de perfil.',
    mensagem: 'Um detalhe floral só seu.',
    tipo: 'personalizacao',
  },
  {
    chave: 'tema_jardim_rose',
    nome: 'Tema "Jardim Rose"',
    descricao: 'Tema visual exclusivo com cores, fundos e pequenos detalhes florais.',
    mensagem: 'Um jardim só seu, dentro do app.',
    tipo: 'personalizacao',
  },
  {
    chave: 'kit_digital_autocuidado',
    nome: 'Kit Digital de Autocuidado',
    descricao: 'Wallpapers, cartões de afirmações, páginas de reflexão e materiais para baixar.',
    mensagem: 'Um presente para os seus próximos dias.',
    tipo: 'conteudo',
  },
  {
    chave: 'experiencia_especial_rose',
    nome: 'Experiência Especial Rose',
    descricao: 'Práticas especiais, áudios relaxantes e reflexões de autocompaixão.',
    mensagem: 'Um convite para ir ainda mais fundo no seu cuidado.',
    tipo: 'experiencia',
  },
  {
    chave: 'beneficio_parceiro_rose',
    nome: 'Benefício de Parceiro Rose',
    descricao: 'Desconto, produto digital ou benefício de uma marca parceira alinhada aos valores do Rose.',
    mensagem: 'Em breve.',
    tipo: 'futura',
  },
  {
    chave: 'presente_especial_rose',
    nome: 'Viagem surpresa Rose',
    descricao:
      'Uma viagem para um destino surpresa escolhido pela equipe Rose. Datas, condições, elegibilidade e detalhes serão divulgados antes da campanha.',
    mensagem: 'O destino é surpresa. A experiência será escolhida com carinho pela equipe Rose.',
    tipo: 'experiencia',
  },
];
