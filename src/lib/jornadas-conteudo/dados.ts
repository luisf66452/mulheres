// Dados temporários e centralizados das 4 jornadas iniciais. Quando o
// conteúdo real existir no Supabase, esta é a única peça que precisa ser
// trocada por uma consulta ao banco — os componentes consomem só os tipos
// de `./tipos`, nunca este array diretamente por nome.
import type { Jornada, Modulo } from './tipos';

function montarModulos(
  jornadaSlug: string,
  especificacao: { titulo: string; sessoes: number }[],
  sessoesConcluidas: number
): Modulo[] {
  let contador = 0;

  return especificacao.map((modulo, indiceModulo) => ({
    id: `${jornadaSlug}-m${indiceModulo + 1}`,
    titulo: modulo.titulo,
    sessoes: Array.from({ length: modulo.sessoes }, (_, indiceSessao) => {
      contador += 1;
      const concluida = contador <= sessoesConcluidas;
      const bloqueada = contador > sessoesConcluidas + 1;

      return {
        id: `${jornadaSlug}-m${indiceModulo + 1}-s${indiceSessao + 1}`,
        titulo: `Sessão ${indiceSessao + 1}`,
        descricao: 'Conteúdo a ser adicionado.',
        duracaoMinutos: null,
        miniaturaUrl: null,
        conteudo: null,
        concluida,
        bloqueada,
        progresso: concluida ? 100 : 0,
        ultimaAtividadeEm: null,
      };
    }),
  }));
}

export const JORNADAS: Jornada[] = [
  {
    id: 'imagem-corporal',
    slug: 'imagem-corporal',
    titulo: 'Imagem corporal',
    descricaoCurta: 'Uma jornada para cultivar uma relação mais gentil com o seu corpo.',
    corCartao: 'pessego',
    progressoPercentual: 35,
    temasFuturos: [
      'Relação com o próprio corpo',
      'Comparação da aparência',
      'Idealização do corpo perfeito',
      'Autocrítica',
      'Aceitação corporal',
      'Neutralidade corporal',
      'Autocompaixão',
      'Influência das redes sociais',
    ],
    modulos: montarModulos(
      'imagem-corporal',
      [
        { titulo: 'Relação com o próprio corpo', sessoes: 4 },
        { titulo: 'Comparação da aparência', sessoes: 4 },
        { titulo: 'Idealização do corpo perfeito', sessoes: 4 },
        { titulo: 'Autocrítica e aceitação corporal', sessoes: 4 },
        { titulo: 'Neutralidade corporal e autocompaixão', sessoes: 4 },
        { titulo: 'Influência das redes sociais', sessoes: 4 },
      ],
      8
    ),
  },
  {
    id: 'autocompaixao',
    slug: 'autocompaixao',
    titulo: 'Autocompaixão',
    descricaoCurta: 'Práticas para desenvolver uma voz interior mais gentil e acolhedora.',
    corCartao: 'creme-rosado',
    progressoPercentual: 45,
    temasFuturos: [
      'Crítica interna',
      'Culpa',
      'Vergonha',
      'Gentileza consigo mesma',
      'Aceitação das imperfeições',
      'Regulação emocional',
      'Cuidado pessoal',
      'Desenvolvimento de uma voz interior mais acolhedora',
    ],
    modulos: montarModulos(
      'autocompaixao',
      [
        { titulo: 'Crítica interna', sessoes: 3 },
        { titulo: 'Culpa', sessoes: 3 },
        { titulo: 'Vergonha', sessoes: 3 },
        { titulo: 'Gentileza consigo mesma', sessoes: 3 },
        { titulo: 'Aceitação das imperfeições', sessoes: 3 },
        { titulo: 'Regulação emocional', sessoes: 3 },
        { titulo: 'Cuidado pessoal e voz interior acolhedora', sessoes: 3 },
      ],
      9
    ),
  },
  {
    id: 'comparacao',
    slug: 'comparacao',
    titulo: 'Comparação',
    descricaoCurta: 'Reduza a comparação social e fortaleça o reconhecimento de si mesma.',
    corCartao: 'lilas',
    progressoPercentual: 40,
    temasFuturos: [
      'Comparação social',
      'Redes sociais',
      'Sensação de não ser suficiente',
      'Insegurança',
      'Busca por validação',
      'Autenticidade',
      'Reconhecimento das próprias qualidades',
      'Redução de pensamentos comparativos',
    ],
    modulos: montarModulos(
      'comparacao',
      [
        { titulo: 'Comparação social', sessoes: 3 },
        { titulo: 'Redes sociais', sessoes: 3 },
        { titulo: 'Sensação de não ser suficiente', sessoes: 3 },
        { titulo: 'Insegurança e busca por validação', sessoes: 3 },
        { titulo: 'Autenticidade', sessoes: 3 },
        { titulo: 'Reconhecimento das próprias qualidades', sessoes: 3 },
      ],
      7
    ),
  },
  {
    id: 'alimentacao-emocional',
    slug: 'alimentacao-emocional',
    titulo: 'Alimentação emocional',
    descricaoCurta: 'Construa uma relação mais consciente e sem punição com a comida.',
    corCartao: 'salvia',
    progressoPercentual: 27,
    temasFuturos: [
      'Fome física e fome emocional',
      'Emoções relacionadas à alimentação',
      'Culpa após comer',
      'Restrições alimentares',
      'Compulsão alimentar',
      'Relação mais consciente com a comida',
      'Identificação de gatilhos emocionais',
      'Autocuidado sem punição',
    ],
    modulos: montarModulos(
      'alimentacao-emocional',
      [
        { titulo: 'Fome física e fome emocional', sessoes: 3 },
        { titulo: 'Emoções relacionadas à alimentação', sessoes: 3 },
        { titulo: 'Culpa após comer', sessoes: 3 },
        { titulo: 'Restrições alimentares', sessoes: 3 },
        { titulo: 'Compulsão alimentar', sessoes: 3 },
        { titulo: 'Relação mais consciente com a comida', sessoes: 3 },
        { titulo: 'Identificação de gatilhos e autocuidado sem punição', sessoes: 2 },
      ],
      5
    ),
  },
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
