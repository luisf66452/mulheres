import { describe, it, expect } from 'vitest';
import { avaliarCheckin, type CheckinAnswers } from './recommend';
import type { RegraRecomendacao } from '@/lib/supabase/types';

function regra(overrides: Partial<RegraRecomendacao>): RegraRecomendacao {
  return {
    id: 'regra-1',
    humor_min: 1,
    humor_max: 5,
    imagem_corporal_min: 1,
    imagem_corporal_max: 5,
    comida_min: 1,
    comida_max: 5,
    eh_sinal_seguranca: false,
    categoria_pratica: 'geral_positivo',
    prioridade: 0,
    ativa: true,
    ...overrides,
  };
}

describe('avaliarCheckin', () => {
  it('recomenda a categoria da regra que corresponde às respostas', () => {
    const answers: CheckinAnswers = { humor: 2, imagemCorporal: 3, comida: 4 };
    const regras = [regra({ id: 'r1', humor_min: 1, humor_max: 2, categoria_pratica: 'humor_baixo' })];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'humor_baixo' });
  });

  it('retorna sinal_seguranca quando a regra correspondente é marcada como tal', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'r-risco', humor_min: 1, humor_max: 1, imagem_corporal_min: 1, imagem_corporal_max: 1, comida_min: 1, comida_max: 1, eh_sinal_seguranca: true, categoria_pratica: null, prioridade: 100 }),
      regra({ id: 'r-geral', prioridade: 0 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'sinal_seguranca' });
  });

  it('escolhe a regra de maior prioridade quando várias correspondem', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'baixa', categoria_pratica: 'geral_positivo', prioridade: 0 }),
      regra({ id: 'alta', categoria_pratica: 'humor_baixo', prioridade: 10 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'humor_baixo' });
  });

  it('ignora regras inativas', () => {
    const answers: CheckinAnswers = { humor: 1, imagemCorporal: 1, comida: 1 };
    const regras = [
      regra({ id: 'inativa', categoria_pratica: 'nao_deveria_aparecer', ativa: false, prioridade: 100 }),
      regra({ id: 'ativa', categoria_pratica: 'geral_positivo', prioridade: 0 }),
    ];

    expect(avaliarCheckin(answers, regras)).toEqual({ tipo: 'pratica', categoria: 'geral_positivo' });
  });

  it('lança erro quando nenhuma regra corresponde', () => {
    const answers: CheckinAnswers = { humor: 5, imagemCorporal: 5, comida: 5 };
    const regras = [regra({ humor_min: 1, humor_max: 1 })];

    expect(() => avaliarCheckin(answers, regras)).toThrow(/nenhuma regra/i);
  });
});
