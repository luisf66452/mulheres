import { describe, expect, it } from 'vitest';
import {
  escolherSessaoEmAndamento,
  escolherProximaSessaoDesbloqueada,
  resolverProximaAcaoJornada,
  type LinhaProgressoSessao,
} from './continuarDeOndeParei';
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
    revisaoStatus: 'pendente',
  };
}

function criarJornada(slug: string, idsSessoes: string[]): Jornada {
  return {
    id: slug,
    slug,
    titulo: `Jornada ${slug}`,
    descricaoCurta: 'desc',
    corCartao: 'pessego',
    modulos: [{ id: `${slug}-m1`, titulo: 'Módulo 1', sessoes: idsSessoes.map(criarSessao) }],
  };
}

const JORNADA_A = criarJornada('jornada-a', ['a-s1', 'a-s2', 'a-s3']);
const JORNADA_B = criarJornada('jornada-b', ['b-s1', 'b-s2']);

describe('escolherSessaoEmAndamento', () => {
  it('retorna null quando não há nenhuma sessão em andamento', () => {
    expect(escolherSessaoEmAndamento([])).toBeNull();
  });

  it('retorna a sessão com concluida_em nulo', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s2', iniciadaEm: '2026-08-21T10:00:00.000Z', concluidaEm: null },
    ];
    expect(escolherSessaoEmAndamento(linhas)?.sessaoId).toBe('a-s2');
  });

  it('com mais de uma sessão em andamento em jornadas diferentes, escolhe a mais recentemente iniciada', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: null },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-22T10:00:00.000Z', concluidaEm: null },
    ];
    expect(escolherSessaoEmAndamento(linhas)?.sessaoId).toBe('b-s1');
  });
});

describe('escolherProximaSessaoDesbloqueada', () => {
  it('retorna null quando nenhuma jornada tem progresso registrado', () => {
    expect(escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], [])).toBeNull();
  });

  it('retorna a próxima sessão desbloqueada (não a bloqueada) de uma jornada com uma sessão concluída', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-a', sessaoId: 'a-s2' });
  });

  it('retorna null para uma jornada totalmente concluída (não sobra sessão desbloqueada)', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s2', iniciadaEm: '2026-08-21T10:00:00.000Z', concluidaEm: '2026-08-21T10:05:00.000Z' },
    ];
    expect(escolherProximaSessaoDesbloqueada([JORNADA_B], linhas)).toBeNull();
  });

  it('nunca retorna uma sessão bloqueada (mais adiante do ponto real de progresso)', () => {
    // a-s1 concluída, a-s2 é a próxima desbloqueada, a-s3 continua bloqueada.
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-20T10:00:00.000Z', concluidaEm: '2026-08-20T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A], linhas);
    expect(resultado?.sessaoId).not.toBe('a-s3');
    expect(resultado?.sessaoId).toBe('a-s2');
  });

  it('com progresso em duas jornadas, escolhe a jornada tocada mais recentemente', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-22T10:00:00.000Z', concluidaEm: '2026-08-22T10:05:00.000Z' },
    ];
    const resultado = escolherProximaSessaoDesbloqueada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-b', sessaoId: 'b-s2' });
  });
});

describe('resolverProximaAcaoJornada (prioridade)', () => {
  it('prioriza retomar uma sessão em andamento sobre buscar a próxima desbloqueada', () => {
    const linhas: LinhaProgressoSessao[] = [
      // jornada-a: s1 concluída, s2 desbloqueada mas nunca tocada.
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
      // jornada-b: s1 iniciada e NÃO concluída — deve vencer, mesmo sendo mais antiga.
      { jornadaSlug: 'jornada-b', sessaoId: 'b-s1', iniciadaEm: '2026-08-10T10:00:00.000Z', concluidaEm: null },
    ];
    const resultado = resolverProximaAcaoJornada([JORNADA_A, JORNADA_B], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-b', sessaoId: 'b-s1', modo: 'retomar' });
  });

  it('sem sessão em andamento, cai para a próxima sessão desbloqueada', () => {
    const linhas: LinhaProgressoSessao[] = [
      { jornadaSlug: 'jornada-a', sessaoId: 'a-s1', iniciadaEm: '2026-08-18T10:00:00.000Z', concluidaEm: '2026-08-18T10:05:00.000Z' },
    ];
    const resultado = resolverProximaAcaoJornada([JORNADA_A], linhas);
    expect(resultado).toEqual({ jornadaSlug: 'jornada-a', sessaoId: 'a-s2', modo: 'proxima' });
  });

  it('sem nenhum progresso em nenhuma jornada, retorna null', () => {
    expect(resolverProximaAcaoJornada([JORNADA_A, JORNADA_B], [])).toBeNull();
  });
});
