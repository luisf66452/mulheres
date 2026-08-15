import { describe, it, expect } from 'vitest';
import { registrarConclusao, listarTodasConclusoes } from './armazenamento';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Linha = Database['public']['Tables']['conclusoes_praticas_conteudo']['Row'];

// Fake mínimo do client Supabase, cobrindo só a cadeia de chamadas que
// armazenamento.ts realmente usa (select/eq/gte/lte/limit e insert).
function criarSupabaseFake() {
  const linhas: Linha[] = [];
  let proximoId = 1;

  const client = {
    from(tabela: string) {
      if (tabela !== 'conclusoes_praticas_conteudo') {
        throw new Error(`tabela inesperada no fake: ${tabela}`);
      }
      const filtros: ((linha: Linha) => boolean)[] = [];
      const builder = {
        select() {
          return builder;
        },
        eq(coluna: keyof Linha, valor: unknown) {
          filtros.push((linha) => linha[coluna] === valor);
          return builder;
        },
        gte(coluna: keyof Linha, valor: string) {
          filtros.push((linha) => (linha[coluna] as string) >= valor);
          return builder;
        },
        lte(coluna: keyof Linha, valor: string) {
          filtros.push((linha) => (linha[coluna] as string) <= valor);
          return builder;
        },
        limit(n: number) {
          const resultado = linhas.filter((linha) => filtros.every((f) => f(linha))).slice(0, n);
          return Promise.resolve({ data: resultado, error: null });
        },
        insert(valores: Omit<Linha, 'id'>) {
          linhas.push({ ...valores, id: String(proximoId++) });
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve: (v: { data: Linha[]; error: null }) => void) {
          const resultado = linhas.filter((linha) => filtros.every((f) => f(linha)));
          resolve({ data: resultado, error: null });
        },
      };
      return builder;
    },
  };

  return client as unknown as SupabaseClient<Database>;
}

describe('registrarConclusao / listarTodasConclusoes', () => {
  it('registra uma conclusão e permite listá-la', async () => {
    const supabase = criarSupabaseFake();
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(1);
  });

  it('não duplica quando a mesma conclusão é registrada duas vezes seguidas (duplo toque)', async () => {
    const supabase = criarSupabaseFake();
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:02.000Z',
      duracaoMinutos: 3,
    });
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(1);
  });

  it('permite duas conclusões da mesma prática fora da janela de idempotência', async () => {
    const supabase = criarSupabaseFake();
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T18:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(2);
  });

  it('não mistura conclusões de usuárias diferentes', async () => {
    const supabase = criarSupabaseFake();
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u2',
      concluidaEm: '2026-08-13T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(1);
    expect(await listarTodasConclusoes(supabase, 'u2')).toHaveLength(1);
  });

  it('soma conclusões de dias diferentes para a mesma usuária', async () => {
    const supabase = criarSupabaseFake();
    await registrarConclusao(supabase, {
      praticaId: 'respiracao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-10T10:00:00.000Z',
      duracaoMinutos: 3,
    });
    await registrarConclusao(supabase, {
      praticaId: 'meditacao',
      usuariaId: 'u1',
      concluidaEm: '2026-08-11T10:00:00.000Z',
      duracaoMinutos: 5,
    });
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(2);
  });

  it('retorna lista vazia quando não há nenhuma conclusão registrada', async () => {
    const supabase = criarSupabaseFake();
    expect(await listarTodasConclusoes(supabase, 'u1')).toHaveLength(0);
  });
});
