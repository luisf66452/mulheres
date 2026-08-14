import { VALORES_PETALAS } from './config';

// Definição do desafio semanal do Clube Rose. NÃO alterar sem autorização
// explícita do usuário (mesma regra de VALORES_PETALAS).
export const DESAFIO_SEMANAL = {
  titulo: 'Uma semana de gentileza com você',
  descricao: 'Conclua cinco pequenas práticas de autocuidado durante esta semana.',
  meta: 5,
  recompensa: VALORES_PETALAS.desafioSemanal,
} as const;
