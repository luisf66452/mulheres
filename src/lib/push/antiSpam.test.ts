import { describe, it, expect } from 'vitest';
import { avaliarLimiteDeEnvio, LIMITE_DIARIO, LIMITE_SEMANAL, INTERVALO_MINIMO_HORAS } from './antiSpam';

const agora = new Date('2026-08-15T12:00:00.000Z');
const horasAtras = (h: number) => new Date(agora.getTime() - h * 60 * 60 * 1000);

describe('avaliarLimiteDeEnvio', () => {
  it('permite envio quando nao ha historico', () => {
    expect(avaliarLimiteDeEnvio(agora, [])).toEqual({ podeEnviar: true });
  });

  it(`bloqueia apos ${LIMITE_DIARIO} envios no mesmo dia`, () => {
    const envios = [horasAtras(10), horasAtras(20)];
    const resultado = avaliarLimiteDeEnvio(agora, envios);
    expect(resultado.podeEnviar).toBe(false);
    expect(resultado.motivo).toBe('limite_diario');
  });

  it(`bloqueia apos ${LIMITE_SEMANAL} envios na semana, mesmo respeitando o limite diario`, () => {
    // 8 envios espacados por 20h cada (nunca mais de 1 por dia), todos dentro de 7 dias (160h < 168h).
    const envios = Array.from({ length: LIMITE_SEMANAL }, (_, i) => horasAtras(20 * (i + 1)));
    const resultado = avaliarLimiteDeEnvio(agora, envios);
    expect(resultado.podeEnviar).toBe(false);
    expect(resultado.motivo).toBe('limite_semanal');
  });

  it(`bloqueia quando o ultimo envio foi ha menos de ${INTERVALO_MINIMO_HORAS}h`, () => {
    const resultado = avaliarLimiteDeEnvio(agora, [horasAtras(2)]);
    expect(resultado.podeEnviar).toBe(false);
    expect(resultado.motivo).toBe('intervalo_minimo');
  });

  it('permite quando o ultimo envio foi ha mais do intervalo minimo e dentro dos limites diario/semanal', () => {
    const resultado = avaliarLimiteDeEnvio(agora, [horasAtras(9)]);
    expect(resultado.podeEnviar).toBe(true);
  });

  it('ignora envios de mais de uma semana atras ao contar o limite semanal', () => {
    const envios = Array.from({ length: 10 }, (_, i) => horasAtras(24 * 30 + i)); // 30 dias atras
    const resultado = avaliarLimiteDeEnvio(agora, envios);
    expect(resultado.podeEnviar).toBe(true);
  });
});
