import { describe, it, expect } from 'vitest';
import { decidirProximaEtapaCheckin } from './roteamento';
import type { Recomendacao } from './recommend';

describe('decidirProximaEtapaCheckin', () => {
  const recomendacaoSeguranca: Recomendacao = { tipo: 'sinal_seguranca' };
  const recomendacaoPratica: Recomendacao = { tipo: 'pratica', categoria: 'humor_baixo' };

  it('sinal de segurança tem prioridade mesmo com jornada ativa, atividade disponível e prática rápida escolhida', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('sinal de segurança tem prioridade mesmo com "guardar" escolhido', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoSeguranca,
      proximaAcaoEscolhida: 'guardar',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'seguranca' });
  });

  it('"guardar" não rotea para jornada nem prática, mesmo com jornada ativa disponível', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'guardar',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'guardar' });
  });

  it('"entender" com jornada ativa e atividade disponível vai para jornada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('"pratica_rapida" com jornada ativa e atividade disponível vai para jornada (mesmo roteamento de "entender")', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: true,
    });
    expect(resultado).toEqual({ tipo: 'jornada' });
  });

  it('jornada ativa sem atividade cadastrada para o dia cai para a prática recomendada', () => {
    const resultado = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: { jornadaId: 'j1', diasCompletados: 2 },
      atividadeDoDiaExiste: false,
    });
    expect(resultado).toEqual({ tipo: 'pratica' });
  });

  it('sem jornada ativa, "entender" e "pratica_rapida" levam à prática recomendada', () => {
    const resultado1 = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'entender',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    const resultado2 = decidirProximaEtapaCheckin({
      recomendacao: recomendacaoPratica,
      proximaAcaoEscolhida: 'pratica_rapida',
      jornadaAtiva: null,
      atividadeDoDiaExiste: false,
    });
    expect(resultado1).toEqual({ tipo: 'pratica' });
    expect(resultado2).toEqual({ tipo: 'pratica' });
  });
});
