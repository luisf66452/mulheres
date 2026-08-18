import type { IdReferenciaCientifica } from './tipos';

export interface ReferenciaCientifica {
  id: IdReferenciaCientifica;
  titulo: string;
  url: string;
  /** Explicação em linguagem simples, para a seção recolhível "Base científica" — nunca linguagem acadêmica. */
  resumoSimples: string;
}

// Referências fornecidas para fundamentar a redação do conteúdo — nenhuma
// sessão cita eficácia garantida a partir delas, e nenhum texto de sessão
// reproduz trechos dos artigos.
export const REFERENCIAS_CIENTIFICAS: Record<IdReferenciaCientifica, ReferenciaCientifica> = {
  E1: {
    id: 'E1',
    titulo: 'Neff — modelo e evidências sobre autocompaixão',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35961039/',
    resumoSimples:
      'Reúne o que se sabe hoje sobre tratar a si mesma com a mesma gentileza que se ofereceria a alguém querido, e como isso se relaciona com bem-estar.',
  },
  E2: {
    id: 'E2',
    titulo: 'Neff e Germer — ensaio controlado do programa Mindful Self-Compassion',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23070875/',
    resumoSimples:
      'Testou um programa estruturado de autocompaixão e mediu mudanças em autocrítica e bem-estar ao longo do tempo.',
  },
  E3: {
    id: 'E3',
    titulo: 'Alleva et al. — abordagem baseada na funcionalidade corporal em mulheres',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29522927/',
    resumoSimples:
      'Estudou o efeito de focar no que o corpo faz por você (funcionalidade), em vez de como ele parece, sobre a relação com o próprio corpo.',
  },
  E4: {
    id: 'E4',
    titulo: 'Revisão sobre alfabetização midiática, dissonância cognitiva e imagem corporal',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34962632/',
    resumoSimples:
      'Reúne estudos sobre como aprender a "ler" imagens de mídia de forma crítica pode reduzir o impacto negativo delas na imagem corporal.',
  },
  E5: {
    id: 'E5',
    titulo: 'Ensaio sobre uma pausa de uma semana das redes sociais e imagem corporal',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38692094/',
    resumoSimples:
      'Testou o efeito de reduzir o uso de redes sociais por um período curto sobre como as pessoas se sentiam em relação ao próprio corpo.',
  },
  E6: {
    id: 'E6',
    titulo: 'Ensaio brasileiro com mulheres de 18 a 35 anos sobre alimentação intuitiva e dissonância cognitiva',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42259168/',
    resumoSimples:
      'Estudo com mulheres brasileiras na mesma faixa etária do Rose, sobre práticas que ajudam a questionar ideais de corpo e comer de forma mais intuitiva.',
  },
  E7: {
    id: 'E7',
    titulo: 'Ensaio sobre alimentação consciente, percepção corporal e atitudes alimentares',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40091515/',
    resumoSimples:
      'Estudou o efeito de prestar atenção plena ao comer sobre a relação com a comida e com o próprio corpo.',
  },
  E8: {
    id: 'E8',
    titulo: 'NICE NG69 — reconhecimento e tratamento de transtornos alimentares e compulsão',
    url: 'https://www.nice.org.uk/guidance/ng69/ifp/chapter/Binge-eating-disorder',
    resumoSimples:
      'Guia clínico oficial (Reino Unido) sobre como reconhecer sinais de compulsão alimentar e quando buscar tratamento profissional.',
  },
  E9: {
    id: 'E9',
    titulo: 'Meta-análise de Terapia de Aceitação e Compromisso',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25547522/',
    resumoSimples:
      'Reúne vários estudos sobre uma abordagem que ensina a conviver com pensamentos e emoções difíceis sem lutar contra eles, agindo conforme valores pessoais.',
  },
  E10: {
    id: 'E10',
    titulo: 'Escrita autocompassiva e sofrimento relacionado à imagem corporal',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29688834/',
    resumoSimples:
      'Estudou o efeito de exercícios de escrita autocompassiva sobre o sofrimento ligado à imagem corporal.',
  },
};

export function listarReferencias(ids: IdReferenciaCientifica[]): ReferenciaCientifica[] {
  return ids.map((id) => REFERENCIAS_CIENTIFICAS[id]);
}
