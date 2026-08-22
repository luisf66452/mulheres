// Tipos e mapeamento puro entre a linha de preferencias_notificacoes
// (banco, migração 0020) e o formato usado pelo formulário. A leitura/
// escrita de verdade vive em src/app/perfil/notificacoes/actions.ts (I/O
// via Supabase) — este arquivo fica só com lógica pura, testável sem banco.
import type { PreferenciasNotificacao } from '@/lib/supabase/types';

export interface NotificacoesPreferencias {
  lembreteCheckin: boolean;
  lembreteJornada: boolean;
  lembretePraticas: boolean;
  avisosNovidades: boolean;
  resumoSemanal: boolean;
  lembreteInatividade: boolean;
  horarioSilencioInicio: string;
  horarioSilencioFim: string;
  pausadaAte: string | null;
  diasSemana: number[];
}

export const NOTIFICACOES_PADRAO: NotificacoesPreferencias = {
  lembreteCheckin: true,
  lembreteJornada: true,
  lembretePraticas: true,
  avisosNovidades: false,
  resumoSemanal: true,
  lembreteInatividade: true,
  horarioSilencioInicio: '21:30',
  horarioSilencioFim: '09:00',
  pausadaAte: null,
  diasSemana: [0, 1, 2, 3, 4, 5, 6],
};

export function linhaParaPreferencias(linha: PreferenciasNotificacao | null): NotificacoesPreferencias {
  if (!linha) return NOTIFICACOES_PADRAO;
  return {
    lembreteCheckin: linha.lembrete_checkin,
    lembreteJornada: linha.lembrete_jornada,
    lembretePraticas: linha.lembrete_praticas,
    avisosNovidades: linha.avisos_novidades,
    resumoSemanal: linha.resumo_semanal,
    lembreteInatividade: linha.lembrete_inatividade,
    horarioSilencioInicio: linha.horario_silencio_inicio?.slice(0, 5) ?? NOTIFICACOES_PADRAO.horarioSilencioInicio,
    horarioSilencioFim: linha.horario_silencio_fim?.slice(0, 5) ?? NOTIFICACOES_PADRAO.horarioSilencioFim,
    pausadaAte: linha.pausada_ate,
    diasSemana: linha.dias_semana,
  };
}

export function preferenciasParaColunas(
  preferencias: Partial<NotificacoesPreferencias>
): Partial<Omit<PreferenciasNotificacao, 'usuaria_id' | 'atualizada_em'>> {
  const colunas: Partial<Omit<PreferenciasNotificacao, 'usuaria_id' | 'atualizada_em'>> = {};
  if (preferencias.lembreteCheckin !== undefined) colunas.lembrete_checkin = preferencias.lembreteCheckin;
  if (preferencias.lembreteJornada !== undefined) colunas.lembrete_jornada = preferencias.lembreteJornada;
  if (preferencias.lembretePraticas !== undefined) colunas.lembrete_praticas = preferencias.lembretePraticas;
  if (preferencias.avisosNovidades !== undefined) colunas.avisos_novidades = preferencias.avisosNovidades;
  if (preferencias.resumoSemanal !== undefined) colunas.resumo_semanal = preferencias.resumoSemanal;
  if (preferencias.lembreteInatividade !== undefined) colunas.lembrete_inatividade = preferencias.lembreteInatividade;
  if (preferencias.horarioSilencioInicio !== undefined) colunas.horario_silencio_inicio = preferencias.horarioSilencioInicio;
  if (preferencias.horarioSilencioFim !== undefined) colunas.horario_silencio_fim = preferencias.horarioSilencioFim;
  if (preferencias.pausadaAte !== undefined) colunas.pausada_ate = preferencias.pausadaAte;
  if (preferencias.diasSemana !== undefined) colunas.dias_semana = preferencias.diasSemana;
  return colunas;
}
