// Catálogo de recompensas do Clube Rose. NÃO alterar valores sem
// autorização explícita do usuário (mesma regra de VALORES_PETALAS).
export interface Recompensa {
  chave: string;
  nome: string;
  descricao: string;
  mensagem: string;
  custo: number;
  tipo: 'digital' | 'personalizacao' | 'conteudo' | 'experiencia' | 'futura';
  // Recompensas "futura" não têm parceria/operação confirmada ainda — nunca
  // podem ser resgatadas, independente de saldo ou plano.
  resgatavel: boolean;
}

export const RECOMPENSAS: Recompensa[] = [
  {
    chave: 'selo_comecei_a_florescer',
    nome: 'Selo "Comecei a Florescer"',
    descricao: 'Selo especial exibido no perfil da usuária.',
    mensagem: 'Toda transformação começa com um pequeno gesto de cuidado.',
    custo: 1000,
    tipo: 'digital',
    resgatavel: true,
  },
  {
    chave: 'moldura_floral_perfil',
    nome: 'Moldura Floral para o Perfil',
    descricao: 'Moldura exclusiva com flores delicadas ao redor da foto de perfil.',
    mensagem: 'Um detalhe floral só seu.',
    custo: 2500,
    tipo: 'personalizacao',
    resgatavel: true,
  },
  {
    chave: 'tema_jardim_rose',
    nome: 'Tema "Jardim Rose"',
    descricao: 'Tema visual exclusivo com cores, fundos e pequenos detalhes florais.',
    mensagem: 'Um jardim só seu, dentro do app.',
    custo: 5000,
    tipo: 'personalizacao',
    resgatavel: true,
  },
  {
    chave: 'kit_digital_autocuidado',
    nome: 'Kit Digital de Autocuidado',
    descricao: 'Wallpapers, cartões de afirmações, páginas de reflexão e materiais para baixar.',
    mensagem: 'Um presente para os seus próximos dias.',
    custo: 7500,
    tipo: 'conteudo',
    resgatavel: true,
  },
  {
    chave: 'experiencia_especial_rose',
    nome: 'Experiência Especial Rose',
    descricao: 'Práticas especiais, áudios relaxantes e reflexões de autocompaixão.',
    mensagem: 'Um convite para ir ainda mais fundo no seu cuidado.',
    custo: 10000,
    tipo: 'experiencia',
    resgatavel: true,
  },
  {
    chave: 'beneficio_parceiro_rose',
    nome: 'Benefício de Parceiro Rose',
    descricao: 'Desconto, produto digital ou benefício de uma marca parceira alinhada aos valores do Rose.',
    mensagem: 'Em breve.',
    custo: 15000,
    tipo: 'futura',
    resgatavel: false,
  },
  {
    chave: 'presente_especial_rose',
    nome: 'Presente Especial Rose',
    descricao: 'Presente físico ou experiência especial, disponível em campanhas específicas.',
    mensagem: 'Recompensa futura.',
    custo: 25000,
    tipo: 'futura',
    resgatavel: false,
  },
];
