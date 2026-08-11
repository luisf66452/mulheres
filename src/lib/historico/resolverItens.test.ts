import { describe, it, expect } from 'vitest';
import { resolverItensHistorico } from './resolverItens';
import type { Checkin, Sessao } from '@/lib/supabase/types';

function criarCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    id: 'checkin-1',
    usuaria_id: 'usuaria-1',
    data: '2026-08-10',
    humor: 3,
    imagem_corporal: 3,
    comida: 3,
    texto_livre: null,
    sinal_seguranca: false,
    criado_em: '2026-08-10T00:00:00.000Z',
    ...overrides,
  };
}

function criarSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'sessao-1',
    checkin_id: 'checkin-1',
    usuaria_id: 'usuaria-1',
    pratica_id: null,
    jornada_atividade_id: null,
    sensacao_antes: null,
    sensacao_depois: null,
    criado_em: '2026-08-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolverItensHistorico', () => {
  it('retorna array vazio quando não há check-ins nem sessões', () => {
    const resultado = resolverItensHistorico([], [], new Map(), new Map());
    expect(resultado).toEqual([]);
  });

  it('resolve descricaoRitual a partir do título da prática quando a sessão tem pratica_id', () => {
    const checkin = criarCheckin({ id: 'checkin-1' });
    const sessao = criarSessao({ checkin_id: 'checkin-1', pratica_id: 'pratica-1' });
    const tituloPorPratica = new Map([['pratica-1', 'Respiração calma']]);

    const resultado = resolverItensHistorico([checkin], [sessao], tituloPorPratica, new Map());

    expect(resultado).toEqual([{ checkin, descricaoRitual: 'Respiração calma' }]);
  });

  it('resolve descricaoRitual a partir do título da atividade quando a sessão tem jornada_atividade_id', () => {
    const checkin = criarCheckin({ id: 'checkin-1' });
    const sessao = criarSessao({ checkin_id: 'checkin-1', jornada_atividade_id: 'atividade-1' });
    const tituloPorAtividade = new Map([['atividade-1', 'Dia 3: gratidão']]);

    const resultado = resolverItensHistorico([checkin], [sessao], new Map(), tituloPorAtividade);

    expect(resultado).toEqual([{ checkin, descricaoRitual: 'Dia 3: gratidão' }]);
  });

  it('retorna descricaoRitual null quando o check-in não tem nenhuma sessão associada (ex: sinal de segurança)', () => {
    const checkin = criarCheckin({ id: 'checkin-1', sinal_seguranca: true });

    const resultado = resolverItensHistorico([checkin], [], new Map(), new Map());

    expect(resultado).toEqual([{ checkin, descricaoRitual: null }]);
  });

  it('retorna descricaoRitual null quando a prática referenciada não está no mapa (ex: prática excluída), sem lançar erro', () => {
    const checkin = criarCheckin({ id: 'checkin-1' });
    const sessao = criarSessao({ checkin_id: 'checkin-1', pratica_id: 'pratica-excluida' });

    const resultado = resolverItensHistorico([checkin], [sessao], new Map(), new Map());

    expect(resultado).toEqual([{ checkin, descricaoRitual: null }]);
  });

  it('resolve cada check-in com a sessão correta quando há múltiplos check-ins', () => {
    const checkinA = criarCheckin({ id: 'checkin-a' });
    const checkinB = criarCheckin({ id: 'checkin-b' });
    const checkinC = criarCheckin({ id: 'checkin-c' });
    const sessaoA = criarSessao({ id: 'sessao-a', checkin_id: 'checkin-a', pratica_id: 'pratica-1' });
    const sessaoB = criarSessao({ id: 'sessao-b', checkin_id: 'checkin-b', jornada_atividade_id: 'atividade-1' });
    const tituloPorPratica = new Map([['pratica-1', 'Prática A']]);
    const tituloPorAtividade = new Map([['atividade-1', 'Atividade B']]);

    const resultado = resolverItensHistorico(
      [checkinA, checkinB, checkinC],
      [sessaoA, sessaoB],
      tituloPorPratica,
      tituloPorAtividade
    );

    expect(resultado).toEqual([
      { checkin: checkinA, descricaoRitual: 'Prática A' },
      { checkin: checkinB, descricaoRitual: 'Atividade B' },
      { checkin: checkinC, descricaoRitual: null },
    ]);
  });
});
