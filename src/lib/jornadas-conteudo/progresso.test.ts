import { describe, it, expect } from 'vitest';
import { calcularEstadosSessoes } from './progresso';

describe('calcularEstadosSessoes', () => {
  it('deixa a primeira sessão sempre disponível quando nada foi feito ainda', () => {
    const estados = calcularEstadosSessoes(['s1', 's2', 's3'], new Set(), new Set());
    expect(estados).toEqual({ s1: 'disponivel', s2: 'bloqueada', s3: 'bloqueada' });
  });

  it('desbloqueia a próxima sessão só depois que a anterior é concluída', () => {
    const estados = calcularEstadosSessoes(['s1', 's2', 's3'], new Set(['s1']), new Set());
    expect(estados).toEqual({ s1: 'concluida', s2: 'disponivel', s3: 'bloqueada' });
  });

  it('marca uma sessão iniciada mas não concluída como em_andamento, e não libera a próxima', () => {
    const estados = calcularEstadosSessoes(['s1', 's2', 's3'], new Set(), new Set(['s1']));
    expect(estados).toEqual({ s1: 'em_andamento', s2: 'bloqueada', s3: 'bloqueada' });
  });

  it('marca todas como concluídas quando toda a sequência foi feita', () => {
    const estados = calcularEstadosSessoes(['s1', 's2'], new Set(['s1', 's2']), new Set());
    expect(estados).toEqual({ s1: 'concluida', s2: 'concluida' });
  });

  it('lida com progresso no meio de uma sequência maior', () => {
    const estados = calcularEstadosSessoes(
      ['s1', 's2', 's3', 's4'],
      new Set(['s1', 's2']),
      new Set()
    );
    expect(estados).toEqual({ s1: 'concluida', s2: 'concluida', s3: 'disponivel', s4: 'bloqueada' });
  });
});
