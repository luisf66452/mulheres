import { describe, it, expect } from 'vitest';
import {
  escolherJornadaAtivaMaisRecente,
  resolverLinkAtividadeDoDia,
  type JornadaAtivaResumo,
} from './emAndamento';

function jornada(overrides: Partial<JornadaAtivaResumo>): JornadaAtivaResumo {
  return {
    id: 'progresso-1',
    jornadaId: 'jornada-1',
    diasCompletados: 2,
    atualizadaEm: '2026-08-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('escolherJornadaAtivaMaisRecente', () => {
  it('retorna null quando não há jornadas ativas', () => {
    expect(escolherJornadaAtivaMaisRecente([])).toBeNull();
  });

  it('retorna a única jornada quando há apenas uma', () => {
    const unica = jornada({ id: 'p1' });
    expect(escolherJornadaAtivaMaisRecente([unica])).toEqual(unica);
  });

  it('escolhe a jornada mais recentemente atualizada quando há mais de uma', () => {
    const antiga = jornada({ id: 'antiga', atualizadaEm: '2026-08-01T00:00:00.000Z' });
    const recente = jornada({ id: 'recente', atualizadaEm: '2026-08-11T00:00:00.000Z' });
    expect(escolherJornadaAtivaMaisRecente([antiga, recente])).toEqual(recente);
  });

  it('não depende da ordem de entrada da lista', () => {
    const antiga = jornada({ id: 'antiga', atualizadaEm: '2026-08-01T00:00:00.000Z' });
    const recente = jornada({ id: 'recente', atualizadaEm: '2026-08-11T00:00:00.000Z' });
    expect(escolherJornadaAtivaMaisRecente([recente, antiga])).toEqual(recente);
  });
});

describe('resolverLinkAtividadeDoDia', () => {
  it('retorna indisponivel quando não há atividade', () => {
    expect(resolverLinkAtividadeDoDia(null, null)).toEqual({ tipo: 'indisponivel' });
  });

  it('retorna indisponivel quando não há atividade, mesmo com check-in do dia', () => {
    expect(resolverLinkAtividadeDoDia(null, 'checkin-1')).toEqual({ tipo: 'indisponivel' });
  });

  it('retorna checkin quando há atividade mas ainda não houve check-in hoje', () => {
    expect(resolverLinkAtividadeDoDia('atividade-1', null)).toEqual({
      tipo: 'checkin',
      href: '/checkin',
    });
  });

  it('retorna atividade com o link completo quando ambos existem', () => {
    expect(resolverLinkAtividadeDoDia('atividade-1', 'checkin-1')).toEqual({
      tipo: 'atividade',
      href: '/jornada-atividade/atividade-1?checkin=checkin-1',
    });
  });
});
