import { describe, it, expect } from 'vitest';
import {
  avaliarSessaoAbandonada,
  avaliarPraticaPendente,
  avaliarSessaoDisponivel,
  avaliarContinuidade,
  avaliarInatividade,
  type SessaoContexto,
} from './regras';

const agora = new Date('2026-08-15T12:00:00.000Z');
const horasAtras = (h: number) => new Date(agora.getTime() - h * 60 * 60 * 1000).toISOString();

function sessao(overrides: Partial<SessaoContexto>): SessaoContexto {
  return {
    sessaoId: 's1',
    jornadaSlug: 'autoestima',
    tipo: 'exercicio',
    estado: 'disponivel',
    iniciadaEm: null,
    concluidaEm: null,
    proximaDeUmaConclusao: false,
    ...overrides,
  };
}

describe('avaliarSessaoAbandonada', () => {
  it('nao gera candidato para sessao bloqueada, concluida ou disponivel', () => {
    const sessoes = [
      sessao({ estado: 'bloqueada' }),
      sessao({ estado: 'concluida', concluidaEm: horasAtras(1) }),
      sessao({ estado: 'disponivel' }),
    ];
    expect(avaliarSessaoAbandonada(sessoes, agora)).toEqual([]);
  });

  it('gera candidato para sessao em andamento ha pelo menos 3h', () => {
    const sessoes = [sessao({ estado: 'em_andamento', iniciadaEm: horasAtras(4) })];
    const resultado = avaliarSessaoAbandonada(sessoes, agora);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].categoria).toBe('sessao_abandonada');
    expect(resultado[0].dedupKey).toBe('sessao_abandonada:s1');
    expect(resultado[0].url).toBe('/jornadas/autoestima/s1');
  });

  it('nao gera candidato para sessao em andamento ha menos de 3h', () => {
    const sessoes = [sessao({ estado: 'em_andamento', iniciadaEm: horasAtras(1) })];
    expect(avaliarSessaoAbandonada(sessoes, agora)).toEqual([]);
  });
});

describe('avaliarPraticaPendente', () => {
  it('so considera tipos reflexivos (reflexao/escrita/exercicio)', () => {
    const sessoes = [sessao({ tipo: 'plano', estado: 'em_andamento', iniciadaEm: horasAtras(30) })];
    expect(avaliarPraticaPendente(sessoes, agora)).toEqual([]);
  });

  it('gera candidato para reflexao pendente ha mais de 24h', () => {
    const sessoes = [sessao({ tipo: 'reflexao', estado: 'em_andamento', iniciadaEm: horasAtras(30) })];
    const resultado = avaliarPraticaPendente(sessoes, agora);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toBe('praticas_pendente:s1');
  });

  it('nao insiste antes de completar 24h', () => {
    const sessoes = [sessao({ tipo: 'reflexao', estado: 'em_andamento', iniciadaEm: horasAtras(10) })];
    expect(avaliarPraticaPendente(sessoes, agora)).toEqual([]);
  });
});

describe('avaliarSessaoDisponivel', () => {
  it('gera um lembrete quando ha sessao disponivel e nenhuma em andamento na jornada', () => {
    const sessoes = [sessao({ estado: 'disponivel' })];
    const resultado = avaliarSessaoDisponivel(sessoes, '2026-08-15');
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toBe('sessao_disponivel:autoestima:2026-08-15');
    expect(resultado[0].url).toBe('/jornadas/autoestima');
  });

  it('nao insiste se ja ha uma sessao em andamento na mesma jornada', () => {
    const sessoes = [
      sessao({ sessaoId: 's1', estado: 'em_andamento', iniciadaEm: horasAtras(1) }),
      sessao({ sessaoId: 's2', estado: 'disponivel' }),
    ];
    expect(avaliarSessaoDisponivel(sessoes, '2026-08-15')).toEqual([]);
  });

  it('nunca notifica sessao bloqueada', () => {
    const sessoes = [sessao({ estado: 'bloqueada' })];
    expect(avaliarSessaoDisponivel(sessoes, '2026-08-15')).toEqual([]);
  });

  it('a dedup_key muda a cada dia local, permitindo um novo lembrete diario', () => {
    const sessoes = [sessao({ estado: 'disponivel' })];
    const hoje = avaliarSessaoDisponivel(sessoes, '2026-08-15')[0].dedupKey;
    const amanha = avaliarSessaoDisponivel(sessoes, '2026-08-16')[0].dedupKey;
    expect(hoje).not.toBe(amanha);
  });
});

describe('avaliarContinuidade', () => {
  it('gera candidato quando a sessao seguinte a uma conclusao esta disponivel ha tempo suficiente', () => {
    const sessoes = [
      sessao({ sessaoId: 's1', estado: 'concluida', concluidaEm: horasAtras(21) }),
      sessao({ sessaoId: 's2', estado: 'disponivel', proximaDeUmaConclusao: true }),
    ];
    const resultado = avaliarContinuidade(sessoes, agora);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toBe('continuidade:s2');
  });

  it('nao gera candidato antes do prazo minimo apos a conclusao', () => {
    const sessoes = [
      sessao({ sessaoId: 's1', estado: 'concluida', concluidaEm: horasAtras(2) }),
      sessao({ sessaoId: 's2', estado: 'disponivel', proximaDeUmaConclusao: true }),
    ];
    expect(avaliarContinuidade(sessoes, agora)).toEqual([]);
  });
});

describe('avaliarInatividade', () => {
  it('nao gera nada sem historico de atividade', () => {
    expect(avaliarInatividade(null, agora)).toEqual([]);
  });

  it('nao gera nada antes de 3 dias', () => {
    const ultimaAtividade = new Date(agora.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(avaliarInatividade(ultimaAtividade, agora)).toEqual([]);
  });

  it('gera o primeiro lembrete aos 3 dias', () => {
    const ultimaAtividade = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);
    const resultado = avaliarInatividade(ultimaAtividade, agora);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toMatch(/^inatividade_3d:/);
  });

  it('gera o segundo lembrete aos 7 dias, com chave diferente do primeiro', () => {
    const ultimaAtividade = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const resultado = avaliarInatividade(ultimaAtividade, agora);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toMatch(/^inatividade_7d:/);
  });

  it('para de gerar depois do segundo lembrete (ex.: 15 dias sem atividade)', () => {
    const ultimaAtividade = new Date(agora.getTime() - 15 * 24 * 60 * 60 * 1000);
    const resultado = avaliarInatividade(ultimaAtividade, agora);
    // ainda gera 1 candidato (o "segundo" estagio), mas a dedup_key é a
    // mesma pra qualquer dia >=7 com a MESMA ultimaAtividadeEm — o banco
    // (constraint unique) é quem garante que só sai uma vez de verdade.
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dedupKey).toMatch(/^inatividade_7d:/);
  });
});
