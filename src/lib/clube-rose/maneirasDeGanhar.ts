import { VALORES_PETALAS } from './config';

export interface ManeiraDeGanhar {
  chave: string;
  titulo: string;
  descricao: string;
  petalas: number;
  disponivel: boolean;
}

// Lista de exibição das formas de ganhar Pétalas. Os valores vêm sempre de
// VALORES_PETALAS — nunca duplicar o número aqui.
export const MANEIRAS_DE_GANHAR: ManeiraDeGanhar[] = [
  {
    chave: 'checkin_diario',
    titulo: 'Check-in emocional do dia',
    descricao: 'Faça seu primeiro check-in emocional do dia.',
    petalas: VALORES_PETALAS.checkinDiario,
    disponivel: true,
  },
  {
    chave: 'pratica_primeira_conclusao',
    titulo: 'Primeira prática concluída',
    descricao: 'Conclua uma prática pela primeira vez.',
    petalas: VALORES_PETALAS.praticaPrimeiraConclusao,
    disponivel: true,
  },
  {
    chave: 'sessao_jornada_primeira_conclusao',
    titulo: 'Primeira sessão de jornada',
    descricao: 'Conclua uma sessão de uma jornada pela primeira vez.',
    petalas: VALORES_PETALAS.sessaoJornadaPrimeiraConclusao,
    disponivel: true,
  },
  {
    chave: 'desafio_semanal',
    titulo: 'Desafio semanal',
    descricao: 'Finalize o desafio semanal do Clube Rose.',
    petalas: VALORES_PETALAS.desafioSemanal,
    disponivel: false,
  },
  {
    chave: 'jornada_completa',
    titulo: 'Jornada completa',
    descricao: 'Conclua uma jornada inteira pela primeira vez.',
    petalas: VALORES_PETALAS.jornadaCompleta,
    disponivel: true,
  },
];
