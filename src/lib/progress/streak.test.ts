import { describe, it, expect } from 'vitest';
import { calcularProgresso7Dias, calcularMelhorSequencia, formatarSequencia, descreverSequencia } from './streak';
import { VOCABULARIO_PROIBIDO } from '@/lib/testing/vocabularioProibido';

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
  it('mostra a mensagem de início no primeiro check-in (nenhum check-in ainda)', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 0,
      diasAtivosUltimos7: [false, false, false, false, false, false, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Comece hoje sua jornada');
  });

  it('mostra o número real de dias consecutivos quando há check-in hoje', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 3,
      totalCheckins: 5,
      diasAtivosUltimos7: [false, false, false, false, true, true, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('3 dias de sequência');
    expect(resultado.mensagem).toBe('Que lindo ver você priorizando você.');
  });

  it('usa singular para 1 dia de sequência', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 1,
      totalCheckins: 1,
      diasAtivosUltimos7: [false, false, false, false, false, false, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('1 dia de sequência');
  });

  it('dia perdido: sem check-in hoje mas com a maior parte da semana ativa, mostra quantos dias cuidou de si', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [true, true, true, true, true, true, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe('Você cuidou de si em 6 dos últimos 7 dias.');
  });

  it('retorno após pausa: sem check-in hoje e só um dia ativo na semana, ainda reconhece o dia cuidado', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [false, false, false, false, false, true, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe('Você cuidou de si em 1 dos últimos 7 dias.');
  });

  it('semana sem atividade: nenhum dos últimos 7 dias tem check-in, mesmo havendo histórico anterior', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 0,
      totalCheckins: 10,
      diasAtivosUltimos7: [false, false, false, false, false, false, false],
      fezCheckinHoje: false,
    });
    expect(resultado.titulo).toBe('Você pode recomeçar hoje');
    expect(resultado.mensagem).toBe(
      'Nenhum dos últimos 7 dias teve registro — você pode recomeçar quando fizer sentido para você.'
    );
  });

  it('reflete o número real de dias recebido, nunca um valor fixo', () => {
    const resultado = descreverSequencia({
      diasConsecutivosAtuais: 7,
      totalCheckins: 20,
      diasAtivosUltimos7: [true, true, true, true, true, true, true],
      fezCheckinHoje: true,
    });
    expect(resultado.titulo).toBe('7 dias de sequência');
  });

  it('nunca usa vocabulário proibido, em nenhuma combinação de estado', () => {
    const combinacoes: Parameters<typeof descreverSequencia>[0][] = [
      { diasConsecutivosAtuais: 0, totalCheckins: 0, diasAtivosUltimos7: [false, false, false, false, false, false, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 1, totalCheckins: 1, diasAtivosUltimos7: [false, false, false, false, false, false, true], fezCheckinHoje: true },
      { diasConsecutivosAtuais: 5, totalCheckins: 12, diasAtivosUltimos7: [true, true, true, true, true, false, true], fezCheckinHoje: true },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [true, true, true, true, true, true, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [false, false, false, false, false, true, false], fezCheckinHoje: false },
      { diasConsecutivosAtuais: 0, totalCheckins: 8, diasAtivosUltimos7: [false, false, false, false, false, false, false], fezCheckinHoje: false },
    ];

    for (const params of combinacoes) {
      const { titulo, mensagem } = descreverSequencia(params);
      const textoCompleto = `${titulo} ${mensagem}`.toLowerCase();
      for (const termoProibido of VOCABULARIO_PROIBIDO) {
        expect(textoCompleto).not.toContain(termoProibido);
      }
    }
  });
});
