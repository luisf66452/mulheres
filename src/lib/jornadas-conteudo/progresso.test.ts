import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import {
  calcularEstadosSessoes,
  calcularPercentualConcluido,
  carregarProgressoJornada,
  registrarConclusaoSessao,
} from './progresso';
import type { Jornada, Sessao } from './tipos';

type LinhaProgresso = Database['public']['Tables']['sessoes_jornadas_conteudo_progresso']['Row'];

// Fake mínimo do client Supabase, cobrindo só a cadeia de chamadas que
// progresso.ts realmente usa: select/eq (leitura), upsert (início) e
// update/eq/is/select (conclusão). Segue o mesmo estilo de fake usado em
// src/lib/praticas-progresso/armazenamento.test.ts.
function criarSupabaseFake(opcoes: {
  selectResult?: { data: Pick<LinhaProgresso, 'sessao_id' | 'iniciada_em' | 'concluida_em'>[] | null; error: { code: string; message: string } | null };
  updateResult?: { data: { id: string }[] | null; error: { code: string; message: string } | null };
} = {}) {
  const chamadasIs: [string, unknown][] = [];
  const chamadasEq: [string, unknown][] = [];

  const client = {
    from() {
      let atualizando = false;

      const builder: {
        select: (colunas?: string) => typeof builder;
        eq: (coluna: string, valor: unknown) => typeof builder;
        is: (coluna: string, valor: unknown) => typeof builder;
        upsert: (valores: unknown, opts?: unknown) => Promise<{ data: null; error: null }>;
        update: (valores: unknown) => typeof builder;
        then: (resolve: (v: unknown) => void) => void;
      } = {
        select() {
          return builder;
        },
        eq(coluna, valor) {
          chamadasEq.push([coluna, valor]);
          return builder;
        },
        is(coluna, valor) {
          chamadasIs.push([coluna, valor]);
          return builder;
        },
        upsert() {
          return Promise.resolve({ data: null, error: null });
        },
        update() {
          atualizando = true;
          return builder;
        },
        then(resolve) {
          if (atualizando) {
            resolve(opcoes.updateResult ?? { data: [{ id: '1' }], error: null });
          } else {
            resolve(opcoes.selectResult ?? { data: [], error: null });
          }
        },
      };
      return builder;
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    chamadasIs,
    chamadasEq,
  };
}

function criarSessao(id: string): Sessao {
  return {
    id,
    titulo: `Sessão ${id}`,
    descricaoCurta: 'desc',
    duracaoMinutos: 5,
    tipo: 'reflexao',
    entendaEm1Minuto: 'texto',
    praticaGuiada: ['passo 1', 'passo 2', 'passo 3'],
    leveComVoce: 'texto',
    fontesCientificas: ['IC1'],
    revisaoStatus: 'pendente',
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

describe('registrarConclusaoSessao', () => {
  it('usa um UPDATE condicional a `concluida_em is null` — o mecanismo real que impede conceder Pétalas duas vezes', async () => {
    const { client, chamadasIs } = criarSupabaseFake({
      updateResult: { data: [{ id: '1' }], error: null },
    });

    await registrarConclusaoSessao(client, 'u1', 'jornada-teste', 'm1-s1');

    expect(chamadasIs).toContainEqual(['concluida_em', null]);
  });

  it('retorna concluidaAgora: false quando o UPDATE não afeta nenhuma linha (sessão já concluída antes, ex.: segunda chamada concorrente)', async () => {
    const { client } = criarSupabaseFake({
      updateResult: { data: [], error: null },
    });

    const resultado = await registrarConclusaoSessao(client, 'u1', 'jornada-teste', 'm1-s1');

    expect(resultado).toEqual({ concluidaAgora: false });
  });

  it('retorna concluidaAgora: true quando o UPDATE afeta exatamente uma linha (primeira conclusão)', async () => {
    const { client } = criarSupabaseFake({
      updateResult: { data: [{ id: '1' }], error: null },
    });

    const resultado = await registrarConclusaoSessao(client, 'u1', 'jornada-teste', 'm1-s1');

    expect(resultado).toEqual({ concluidaAgora: true });
  });

  it('lança quando o UPDATE de conclusão falha', async () => {
    const { client } = criarSupabaseFake({
      updateResult: { data: null, error: { code: '500', message: 'erro simulado' } },
    });

    await expect(registrarConclusaoSessao(client, 'u1', 'jornada-teste', 'm1-s1')).rejects.toThrow();
  });
});

describe('carregarProgressoJornada', () => {
  it('retorna o progresso indexado por sessao_id quando a leitura tem sucesso', async () => {
    const { client } = criarSupabaseFake({
      selectResult: {
        data: [{ sessao_id: 'm1-s1', iniciada_em: '2026-08-20T00:00:00.000Z', concluida_em: null }],
        error: null,
      },
    });

    const progresso = await carregarProgressoJornada(client, 'u1', 'jornada-teste');

    expect(progresso['m1-s1']).toEqual({
      iniciadaEm: '2026-08-20T00:00:00.000Z',
      concluidaEm: null,
    });
  });

  it('lança em vez de devolver {} silenciosamente quando a leitura falha (evita mostrar zero progresso falso)', async () => {
    const { client } = criarSupabaseFake({
      selectResult: { data: null, error: { code: '500', message: 'erro simulado' } },
    });

    await expect(carregarProgressoJornada(client, 'u1', 'jornada-teste')).rejects.toThrow();
  });
});
