import { describe, it, expect } from 'vitest';
import { estaNaJanelaDeEnvio, diaDaSemanaNoFuso } from './timeWindow';

describe('estaNaJanelaDeEnvio', () => {
  it('retorna true quando o horário local da usuária está dentro da mesma hora do horário preferido', () => {
    // 12:45 UTC = 09:45 em São Paulo (UTC-3).
    const agora = new Date('2026-08-10T12:45:00.000Z');
    expect(estaNaJanelaDeEnvio('09:00:00', agora, 'America/Sao_Paulo')).toBe(true);
  });

  it('retorna false quando o horário local da usuária está fora da hora do horário preferido', () => {
    const agora = new Date('2026-08-10T13:05:00.000Z'); // 10:05 em São Paulo
    expect(estaNaJanelaDeEnvio('09:00:00', agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('retorna false quando não há horário preferido', () => {
    const agora = new Date('2026-08-10T12:05:00.000Z');
    expect(estaNaJanelaDeEnvio(null, agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('usa o fuso da usuária, não o horário UTC do servidor — mesmo instante, fusos diferentes, resultados diferentes', () => {
    // 09:30 UTC: já são 09:30 em Lisboa (UTC+0 no inverno), mas só 06:30 em São Paulo.
    const agora = new Date('2026-01-10T09:30:00.000Z');
    expect(estaNaJanelaDeEnvio('09:00:00', agora, 'Europe/Lisbon')).toBe(true);
    expect(estaNaJanelaDeEnvio('09:00:00', agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('cai de volta ao horário UTC do servidor se o fuso for inválido, sem quebrar', () => {
    const agora = new Date('2026-08-10T09:30:00.000Z');
    expect(estaNaJanelaDeEnvio('09:00:00', agora, 'fuso-que-nao-existe')).toBe(true);
  });
});

describe('diaDaSemanaNoFuso', () => {
  it('retorna o dia da semana local da usuária, não o do servidor, perto da virada da meia-noite', () => {
    // 02:00 UTC de sábado (2026-08-15) já é sexta-feira à noite em São Paulo.
    const agora = new Date('2026-08-15T02:00:00.000Z');
    expect(diaDaSemanaNoFuso(agora, 'UTC')).toBe(6); // sábado
    expect(diaDaSemanaNoFuso(agora, 'America/Sao_Paulo')).toBe(5); // sexta-feira
  });
});
