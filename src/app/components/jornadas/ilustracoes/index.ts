import type { ComponentType } from 'react';
import IlustracaoImagemCorporal from './IlustracaoImagemCorporal';
import IlustracaoAutocompaixao from './IlustracaoAutocompaixao';
import IlustracaoComparacao from './IlustracaoComparacao';
import IlustracaoAlimentacaoEmocional from './IlustracaoAlimentacaoEmocional';

export const MAPA_ILUSTRACOES_POR_SLUG: Record<string, ComponentType<{ className?: string }>> = {
  'imagem-corporal': IlustracaoImagemCorporal,
  autocompaixao: IlustracaoAutocompaixao,
  comparacao: IlustracaoComparacao,
  'alimentacao-emocional': IlustracaoAlimentacaoEmocional,
};
