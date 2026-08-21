import { describe, expect, it } from 'vitest';
import {
  calcularEstadosSessoes,
  calcularPercentualConcluido,
} from './progresso';
import type { Jornada, Sessao } from './tipos';

function criarSessao(id: string): Sessao {
  return {
    id,
    titulo: `Sessão ${id}`,
    descricaoCurta: 'desc',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto: 'texto',
    praticaGuiada: ['passo 1'],
    leveComVoce: 'texto',
    fontesCientificas: ['IC1'],
    revisaoStatus: 'revisado',
  };
}

const JORNADA_FIXTURE: Jornada = {
  id: 'jornada-teste',
  slug: 'jornada-teste',
  titulo: 'Jornada de teste',
  descricaoCurta: 'desc',
  corCartao: 'pessego',
  modulos: [
    {
      id: 'm1',
      titulo: 'Módulo 1',
      sessoes: [criarSessao('m1-s1'), criarSessao('m1-s2')],
    },
    {
      id: 'm2',
      titulo: 'Módulo 2',
      sessoes: [criarSessao('m2-s1'), criarSessao('m2-s2')],
    },
  ],
};

const ORDEM = ['m1-s1', 'm1-s2', 'm2-s1', 'm2-s2'];

describe('calcularEstadosSessoes', () => {
  it('libera só a primeira sessão quando não há progresso', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {});

    expect(estados['m1-s1']).toBe('disponivel');
    expect(estados['m1-s2']).toBe('bloqueada');
    expect(estados['m2-s1']).toBe('bloqueada');
    expect(estados['m2-s2']).toBe('bloqueada');
  });

  it('marca em_andamento quando há linha de progresso sem conclusão', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {
      'm1-s1': { concluidaEm: null },
    });

    expect(estados['m1-s1']).toBe('em_andamento');
    expect(estados['m1-s2']).toBe('bloqueada');
  });

  it('libera a segunda sessão só depois que a primeira está concluída', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {
      'm1-s1': { concluidaEm: '2026-08-21T00:00:00.000Z' },
    });

    expect(estados['m1-s1']).toBe('concluida');
    expect(estados['m1-s2']).toBe('disponivel');
    expect(estados['m2-s1']).toBe('bloqueada');
  });

  it('nunca bloqueia a primeira sessão da jornada', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {});
    expect(estados[ORDEM[0]]).not.toBe('bloqueada');
  });

  it('libera todas as sessões quando tudo está concluído, exceto a última que também libera', () => {
    const progresso = Object.fromEntries(
      ORDEM.slice(0, 3).map((id) => [id, { concluidaEm: '2026-08-21T00:00:00.000Z' }])
    );
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, progresso);

    expect(estados['m1-s1']).toBe('concluida');
    expect(estados['m1-s2']).toBe('concluida');
    expect(estados['m2-s1']).toBe('concluida');
    expect(estados['m2-s2']).toBe('disponivel');
  });
});

describe('calcularPercentualConcluido', () => {
  it('retorna 0% quando nada está concluído', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {});
    expect(calcularPercentualConcluido(JORNADA_FIXTURE, estados)).toBe(0);
  });

  it('retorna 25% com 1 de 4 sessões concluídas', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {
      'm1-s1': { concluidaEm: '2026-08-21T00:00:00.000Z' },
    });
    expect(calcularPercentualConcluido(JORNADA_FIXTURE, estados)).toBe(25);
  });

  it('retorna 50% com 2 de 4 sessões concluídas', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {
      'm1-s1': { concluidaEm: '2026-08-21T00:00:00.000Z' },
      'm1-s2': { concluidaEm: '2026-08-21T00:00:00.000Z' },
    });
    expect(calcularPercentualConcluido(JORNADA_FIXTURE, estados)).toBe(50);
  });

  it('retorna 75% com 3 de 4 sessões concluídas', () => {
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, {
      'm1-s1': { concluidaEm: '2026-08-21T00:00:00.000Z' },
      'm1-s2': { concluidaEm: '2026-08-21T00:00:00.000Z' },
      'm2-s1': { concluidaEm: '2026-08-21T00:00:00.000Z' },
    });
    expect(calcularPercentualConcluido(JORNADA_FIXTURE, estados)).toBe(75);
  });

  it('retorna 100% quando todas as sessões estão concluídas', () => {
    const progresso = Object.fromEntries(
      ORDEM.map((id) => [id, { concluidaEm: '2026-08-21T00:00:00.000Z' }])
    );
    const estados = calcularEstadosSessoes(JORNADA_FIXTURE, progresso);
    expect(calcularPercentualConcluido(JORNADA_FIXTURE, estados)).toBe(100);
  });
});
