import { describe, it, expect } from 'vitest';
import { estadoInicialParaHumor, validarHumorParam, type HumorInicial } from './humorInicial';

describe('estadoInicialParaHumor', () => {
  it.each([
    [1, 'alta_energia_conforto'],
    [2, 'alta_energia_conforto'],
    [3, 'baixa_energia_conforto'],
    [4, 'baixa_energia_desconforto'],
    [5, 'baixa_energia_desconforto'],
  ] as const)('mapeia humor %i para %s', (humor, esperado) => {
    expect(estadoInicialParaHumor(humor as HumorInicial)).toBe(esperado);
  });
});

describe('validarHumorParam', () => {
  it.each(['1', '2', '3', '4', '5'])('aceita o inteiro válido "%s"', (valor) => {
    expect(validarHumorParam(valor)).toBe(Number(valor));
  });

  it.each(['0', '6', '3.5', 'abc', '', '-1', '10'])('rejeita "%s"', (valor) => {
    expect(validarHumorParam(valor)).toBeNull();
  });

  it('rejeita quando o parâmetro está ausente', () => {
    expect(validarHumorParam(undefined)).toBeNull();
  });

  it('rejeita quando o parâmetro aparece mais de uma vez na URL', () => {
    expect(validarHumorParam(['3', '4'])).toBeNull();
  });
});
