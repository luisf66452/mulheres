import { describe, it, expect } from 'vitest';
import { estaNaJanelaDeEnvio } from './timeWindow';

describe('estaNaJanelaDeEnvio', () => {
  it('retorna true quando o horário atual está dentro da mesma hora do horário preferido', () => {
    const agora = new Date(2026, 7, 10, 9, 45); // 09:45
    expect(estaNaJanelaDeEnvio('09:00:00', agora)).toBe(true);
  });

  it('retorna false quando o horário atual está fora da hora do horário preferido', () => {
    const agora = new Date(2026, 7, 10, 10, 5); // 10:05
    expect(estaNaJanelaDeEnvio('09:00:00', agora)).toBe(false);
  });

  it('retorna false quando não há horário preferido', () => {
    const agora = new Date(2026, 7, 10, 9, 5);
    expect(estaNaJanelaDeEnvio(null, agora)).toBe(false);
  });
});
