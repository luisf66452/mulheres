import { describe, it, expect } from 'vitest';
import { decidirTipoNotificacao, type PreferenciasNotificacaoParaDecisao } from './prioridade';

const PREFERENCIAS_TUDO_LIGADO: PreferenciasNotificacaoParaDecisao = {
  lembrete_checkin: true,
  lembrete_jornada: true,
  lembrete_praticas: true,
  resumo_semanal: true,
  dias_semana: [0, 1, 2, 3, 4, 5, 6],
};

describe('decidirTipoNotificacao', () => {
  it('prioriza jornada ativa sobre check-in quando ambos aplicam', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: 'Autocompaixão',
      preferencias: PREFERENCIAS_TUDO_LIGADO,
      diaDaSemana: 2,
    });
    expect(resultado).toBe('jornada');
  });

  it('cai para check-in quando não há jornada ativa', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: null,
      preferencias: PREFERENCIAS_TUDO_LIGADO,
      diaDaSemana: 2,
    });
    expect(resultado).toBe('checkin');
  });

  it('cai para check-in quando há jornada ativa mas o lembrete de jornada está desligado', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: 'Comparação',
      preferencias: { ...PREFERENCIAS_TUDO_LIGADO, lembrete_jornada: false },
      diaDaSemana: 2,
    });
    expect(resultado).toBe('checkin');
  });

  it('cai para práticas quando check-in e jornada estão desligados mas práticas está ligado', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: null,
      preferencias: { ...PREFERENCIAS_TUDO_LIGADO, lembrete_checkin: false, lembrete_jornada: false },
      diaDaSemana: 2,
    });
    expect(resultado).toBe('praticas');
  });

  it('não envia nada quando check-in não foi feito mas todos os lembretes diários estão desligados', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: 'Imagem corporal',
      preferencias: {
        lembrete_checkin: false,
        lembrete_jornada: false,
        lembrete_praticas: false,
        resumo_semanal: true,
        dias_semana: [0, 1, 2, 3, 4, 5, 6],
      },
      diaDaSemana: 2,
    });
    expect(resultado).toBeNull();
  });

  it('envia resumo semanal quando check-in já foi feito, é domingo e a preferência está ligada', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: true,
      jornadaAtivaTitulo: null,
      preferencias: PREFERENCIAS_TUDO_LIGADO,
      diaDaSemana: 0,
    });
    expect(resultado).toBe('resumo_semanal');
  });

  it('não envia resumo semanal em outro dia da semana', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: true,
      jornadaAtivaTitulo: null,
      preferencias: PREFERENCIAS_TUDO_LIGADO,
      diaDaSemana: 3,
    });
    expect(resultado).toBeNull();
  });

  it('não envia nada quando check-in já foi feito e resumo semanal está desligado', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: true,
      jornadaAtivaTitulo: null,
      preferencias: { ...PREFERENCIAS_TUDO_LIGADO, resumo_semanal: false },
      diaDaSemana: 0,
    });
    expect(resultado).toBeNull();
  });

  it('respeita dias_semana mesmo com check-in pendente', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: null,
      preferencias: { ...PREFERENCIAS_TUDO_LIGADO, dias_semana: [1, 2, 3, 4, 5] },
      diaDaSemana: 6,
    });
    expect(resultado).toBeNull();
  });

  it('usa o padrão tudo-ligado quando não há preferências salvas', () => {
    const resultado = decidirTipoNotificacao({
      checkinFeitoHoje: false,
      jornadaAtivaTitulo: null,
      preferencias: null,
      diaDaSemana: 2,
    });
    expect(resultado).toBe('checkin');
  });
});
