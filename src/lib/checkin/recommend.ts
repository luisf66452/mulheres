import type { RegraRecomendacao, AlimentacaoPercebida } from '@/lib/supabase/types';

export interface CheckinAnswers {
  humor: number;
  imagemCorporal: number;
  comida: number;
  textoLivre?: string;
}

export type Recomendacao =
  | { tipo: 'sinal_seguranca' }
  | { tipo: 'pratica'; categoria: string };

export function avaliarCheckin(
  answers: CheckinAnswers,
  regras: RegraRecomendacao[]
): Recomendacao {
  const candidatas = regras
    .filter((r) => r.ativa)
    .filter((r) => answers.humor >= r.humor_min && answers.humor <= r.humor_max)
    .filter(
      (r) =>
        answers.imagemCorporal >= r.imagem_corporal_min &&
        answers.imagemCorporal <= r.imagem_corporal_max
    )
    .filter((r) => answers.comida >= r.comida_min && answers.comida <= r.comida_max)
    .sort((a, b) => b.prioridade - a.prioridade);

  const escolhida = candidatas[0];
  if (!escolhida) {
    throw new Error('Nenhuma regra de recomendação corresponde às respostas do check-in');
  }

  if (escolhida.eh_sinal_seguranca) {
    return { tipo: 'sinal_seguranca' };
  }

  return { tipo: 'pratica', categoria: escolhida.categoria_pratica! };
}

export function decidirRecomendacaoComProtecao(
  answers: {
    humor: number;
    imagemCorporal: number;
    comida: number | null;
    alimentacaoPercebida: AlimentacaoPercebida;
  },
  regras: RegraRecomendacao[]
): Recomendacao {
  if (answers.alimentacaoPercebida === 'vontade_punir') {
    return { tipo: 'sinal_seguranca' };
  }

  return avaliarCheckin(
    { humor: answers.humor, imagemCorporal: answers.imagemCorporal, comida: answers.comida ?? 3 },
    regras
  );
}
