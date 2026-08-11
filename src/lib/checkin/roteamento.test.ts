import { describe, it, expect } from 'vitest';
import { decidirProximaEtapaCheckin } from './roteamento';
import type { Recomendacao } from './recommend';

describe('decidirProximaEtapaCheckin', () => {
  const recomendacaoSeguranca: Recomendacao = { tipo: 'sinal_seguranca' };
  const recomendacaoPratica: Recomendacao = { tipo: 'pratica', categoria: 'humor_baixo' };

  it('sinal de segurança tem prioridade mesmo com jornada ativa e atividade disponível', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('jornada ativa com atividade disponível vence a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('jornada ativa sem atividade cadastrada para o dia cai para a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });

  it('sem jornada ativa, comportamento é a prática recomendada, igual ao fluxo original', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });
});
