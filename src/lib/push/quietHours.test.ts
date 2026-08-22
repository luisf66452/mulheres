import { describe, it, expect } from 'vitest';
import { estaEmHorarioSilencioso, proximoHorarioPermitido } from './quietHours';

describe('estaEmHorarioSilencioso', () => {
  it('detecta horario dentro de uma janela que cruza a meia-noite (21:30-09:00)', () => {
    const meiaNoite = new Date('2026-08-10T02:00:00.000Z'); // 02:00 UTC = 02:00 em UTC (fuso UTC)
    expect(estaEmHorarioSilencioso(meiaNoite, 'UTC', '21:30', '09:00')).toBe(true);
  });

  it('detecta horario fora de uma janela que cruza a meia-noite', () => {
    const meioDia = new Date('2026-08-10T12:00:00.000Z');
    expect(estaEmHorarioSilencioso(meioDia, 'UTC', '21:30', '09:00')).toBe(false);
  });

  it('exatamente no inicio da janela conta como silencioso (inclusivo)', () => {
    const inicio = new Date('2026-08-10T21:30:00.000Z');
    expect(estaEmHorarioSilencioso(inicio, 'UTC', '21:30', '09:00')).toBe(true);
  });

  it('exatamente no fim da janela NAO conta como silencioso (exclusivo)', () => {
    const fim = new Date('2026-08-10T09:00:00.000Z');
    expect(estaEmHorarioSilencioso(fim, 'UTC', '21:30', '09:00')).toBe(false);
  });

  it('suporta janela comum dentro do mesmo dia', () => {
    const dentro = new Date('2026-08-10T02:30:00.000Z');
    const fora = new Date('2026-08-10T06:00:00.000Z');
    expect(estaEmHorarioSilencioso(dentro, 'UTC', '01:00', '05:00')).toBe(true);
    expect(estaEmHorarioSilencioso(fora, 'UTC', '01:00', '05:00')).toBe(false);
  });

  it('usa o fuso da usuaria, nao o do servidor', () => {
    // 23:00 UTC = 20:00 em Sao Paulo (UTC-3) -> ainda fora da janela 21:30-09:00 em SP.
    const instante = new Date('2026-08-10T23:00:00.000Z');
    expect(estaEmHorarioSilencioso(instante, 'America/Sao_Paulo', '21:30', '09:00')).toBe(false);
    expect(estaEmHorarioSilencioso(instante, 'UTC', '21:30', '09:00')).toBe(true);
  });

  it('janela de duracao zero nunca e silenciosa', () => {
    const qualquerHora = new Date('2026-08-10T03:00:00.000Z');
    expect(estaEmHorarioSilencioso(qualquerHora, 'UTC', '09:00', '09:00')).toBe(false);
  });
});

describe('proximoHorarioPermitido', () => {
  it('devolve o proprio instante quando ja esta fora do horario silencioso', () => {
    const meioDia = new Date('2026-08-10T12:00:00.000Z');
    const resultado = proximoHorarioPermitido(meioDia, 'UTC', '21:30', '09:00');
    expect(resultado.getTime()).toBe(meioDia.getTime());
  });

  it('adia para o horario em que a janela termina quando cai dentro do silencio', () => {
    const madrugada = new Date('2026-08-10T02:00:00.000Z');
    const resultado = proximoHorarioPermitido(madrugada, 'UTC', '21:30', '09:00');
    expect(estaEmHorarioSilencioso(resultado, 'UTC', '21:30', '09:00')).toBe(false);
    expect(resultado.getUTCHours()).toBe(9);
    expect(resultado.getUTCMinutes()).toBe(0);
  });
});
