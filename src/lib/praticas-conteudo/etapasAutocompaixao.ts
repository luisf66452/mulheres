export interface EtapaAutocompaixao {
  titulo: string;
  texto: string | null;
  pergunta: string | null;
}

export const ETAPAS_AUTOCOMPAIXAO: EtapaAutocompaixao[] = [
  {
    titulo: 'Reconheça o momento',
    texto: null,
    pergunta: 'O que está sendo difícil para você agora?',
  },
  {
    titulo: 'Lembre-se de que você não está sozinha',
    texto: 'Momentos difíceis fazem parte da experiência humana. Você não precisa enfrentar tudo com perfeição.',
    pergunta: null,
  },
  {
    titulo: 'Fale consigo com gentileza',
    texto: null,
    pergunta: 'O que você diria a uma amiga querida que estivesse passando por isso?',
  },
  {
    titulo: 'Transforme isso em cuidado',
    texto: null,
    pergunta: 'Como você pode dizer essas mesmas palavras para si agora?',
  },
];
