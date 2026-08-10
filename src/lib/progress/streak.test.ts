import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias } from './streak';

describe('calcularProgresso7Dias', () => {
  const hoje = new Date(2026, 7, 10); // 2026-08-10, a Monday

  it('conta 0 dias completos quando não há check-ins', () => {
    const resultado = calcularProgresso7Dias([], hoje);
    expect(resultado.diasCompletos).toBe(0);
    expect(resultado.diasConsecutivosAtuais).toBe(0);
    expect(resultado.ultimos7Dias).toHaveLength(7);
    expect(resultado.ultimos7Dias.every((d) => d.completou === false)).toBe(true);
  });

  it('conta dias completos corretamente dentro da janela de 7 dias', () => {
    const datas = ['2026-08-10', '2026-08-09', '2026-08-07'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasCompletos).toBe(3);
  });

  it('ignora check-ins fora da janela de 7 dias', () => {
    const datas = ['2026-08-10', '2026-07-01'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasCompletos).toBe(1);
  });

  it('calcula sequência consecutiva atual terminando hoje', () => {
    const datas = ['2026-08-10', '2026-08-09', '2026-08-08', '2026-08-06'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasConsecutivosAtuais).toBe(3);
  });

  it('sequência consecutiva é 0 se hoje ainda não tem check-in', () => {
    const datas = ['2026-08-09', '2026-08-08'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    expect(resultado.diasConsecutivosAtuais).toBe(0);
  });

  it('marca cada um dos últimos 7 dias com completou true/false', () => {
    const datas = ['2026-08-10', '2026-08-08'];
    const resultado = calcularProgresso7Dias(datas, hoje);
    const porData = Object.fromEntries(resultado.ultimos7Dias.map((d) => [d.data, d.completou]));
    expect(porData['2026-08-10']).toBe(true);
    expect(porData['2026-08-09']).toBe(false);
    expect(porData['2026-08-08']).toBe(true);
  });
});
