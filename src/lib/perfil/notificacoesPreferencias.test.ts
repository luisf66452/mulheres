import { describe, it, expect } from 'vitest';
import { linhaParaPreferencias, preferenciasParaColunas, NOTIFICACOES_PADRAO } from './notificacoesPreferencias';
import type { PreferenciasNotificacao } from '@/lib/supabase/types';

describe('linhaParaPreferencias', () => {
  it('retorna as preferências padrão quando não há linha (usuária nova)', () => {
    expect(linhaParaPreferencias(null)).toEqual(NOTIFICACOES_PADRAO);
  });

  it('mapeia a linha do banco (snake_case) para o formato do formulário (camelCase)', () => {
    const linha: PreferenciasNotificacao = {
      usuaria_id: 'u1',
      lembrete_checkin: false,
      lembrete_jornada: true,
      lembrete_praticas: false,
      avisos_novidades: true,
      resumo_semanal: false,
      dias_semana: [1, 2, 3],
      atualizada_em: '2026-08-15T00:00:00.000Z',
    };
    expect(linhaParaPreferencias(linha)).toEqual({
      lembreteCheckin: false,
      lembreteJornada: true,
      lembretePraticas: false,
      avisosNovidades: true,
      resumoSemanal: false,
      diasSemana: [1, 2, 3],
    });
  });
});

describe('preferenciasParaColunas', () => {
  it('converte só os campos alterados, sem inventar valores para o resto', () => {
    expect(preferenciasParaColunas({ resumoSemanal: false })).toEqual({ resumo_semanal: false });
  });

  it('converte múltiplos campos de uma vez', () => {
    expect(preferenciasParaColunas({ resumoSemanal: false, avisosNovidades: true })).toEqual({
      resumo_semanal: false,
      avisos_novidades: true,
    });
  });

  it('retorna objeto vazio quando nada foi alterado', () => {
    expect(preferenciasParaColunas({})).toEqual({});
  });
});
