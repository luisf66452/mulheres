import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia, descreverSequencia } from './streak';

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

describe('calcularMelhorSequencia', () => {
  it('retorna 0 quando não há check-ins', () => {
    expect(calcularMelhorSequencia([])).toBe(0);
  });

  it('retorna 1 para um único check-in', () => {
    expect(calcularMelhorSequencia(['2026-08-10'])).toBe(1);
  });

  it('conta uma sequência simples de dias consecutivos', () => {
    const datas = ['2026-08-08', '2026-08-09', '2026-08-10'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('ignora datas fora de ordem e retorna a maior sequência real', () => {
    const datas = ['2026-08-10', '2026-08-08', '2026-08-09'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('encontra a melhor sequência mesmo quando não é a mais recente', () => {
    const datas = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-05', '2026-08-07'];
    expect(calcularMelhorSequencia(datas)).toBe(3);
  });

  it('trata datas duplicadas como um único dia', () => {
    const datas = ['2026-08-01', '2026-08-01', '2026-08-02'];
    expect(calcularMelhorSequencia(datas)).toBe(2);
  });

  it('dias isolados (sem sequência) retornam melhor sequência 1', () => {
    const datas = ['2026-08-01', '2026-08-05', '2026-08-09'];
    expect(calcularMelhorSequencia(datas)).toBe(1);
  });
});

describe('formatarSequencia', () => {
  it('formata 0 dias', () => {
    expect(formatarSequencia(0)).toBe('0 dias seguidos');
  });

  it('formata 1 dia no singular', () => {
    expect(formatarSequencia(1)).toBe('1 dia seguido');
  });

  it('formata mais de 1 dia no plural', () => {
    expect(formatarSequencia(2)).toBe('2 dias seguidos');
    expect(formatarSequencia(10)).toBe('10 dias seguidos');
  });
});

describe('descreverSequencia', () => {
  it('mostra a mensagem de início quando não há nenhum check-in', () => {
    const resultado = descreverSequencia(0, 0);
    expect(resultado.titulo).toBe('Comece hoje sua jornada');
  });

  it('mostra a mensagem acolhedora de recomeço quando a sequência foi quebrada mas há histórico', () => {
    const resultado = descreverSequencia(0, 5);
    expect(resultado.titulo).toBe('Sua sequência está pronta para recomeçar');
    expect(resultado.mensagem).toBe('Cada retorno também faz parte da jornada.');
  });

  it('usa singular para 1 dia de sequência', () => {
    expect(descreverSequencia(1, 1).titulo).toBe('1 dia de sequência');
  });

  it('usa plural para mais de 1 dia de sequência', () => {
    expect(descreverSequencia(7, 10).titulo).toBe('7 dias de sequência');
  });

  it('reflete o número real de dias recebido, nunca um valor fixo', () => {
    expect(descreverSequencia(3, 3).titulo).toBe('3 dias de sequência');
  });
});
