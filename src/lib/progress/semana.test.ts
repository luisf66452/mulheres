import { describe, it, expect } from 'vitest';
import {
  obterSegundaFeira,
  calcularSemana,
  semanaAnteriorISO,
  semanaSeguinteISO,
  resolverSegundaFeira,
} from './semana';

describe('obterSegundaFeira', () => {
  it('retorna a própria data quando já é segunda-feira', () => {
    const segunda = obterSegundaFeira(new Date(2026, 7, 10)); // 2026-08-10, segunda
    expect(segunda.getDate()).toBe(10);
  });

  it('retorna a segunda-feira anterior para um dia no meio da semana', () => {
    const segunda = obterSegundaFeira(new Date(2026, 7, 13)); // quinta
    expect(segunda.getDate()).toBe(10);
  });

  it('trata domingo corretamente (volta 6 dias)', () => {
    const segunda = obterSegundaFeira(new Date(2026, 7, 16)); // domingo
    expect(segunda.getDate()).toBe(10);
  });
});

describe('calcularSemana', () => {
  it('retorna os 7 dias da semana com humor nulo quando não há check-in', () => {
    const dias = calcularSemana([], '2026-08-10');
    expect(dias).toHaveLength(7);
    expect(dias[0].data).toBe('2026-08-10');
    expect(dias[6].data).toBe('2026-08-16');
    expect(dias.every((d) => d.humor === null)).toBe(true);
  });

  it('preenche o humor do dia quando há check-in', () => {
    const dias = calcularSemana([{ data: '2026-08-12', humor: 4 }], '2026-08-10');
    expect(dias[2].humor).toBe(4);
    expect(dias[0].humor).toBeNull();
  });

  it('ignora check-ins fora da semana', () => {
    const dias = calcularSemana([{ data: '2026-08-01', humor: 5 }], '2026-08-10');
    expect(dias.every((d) => d.humor === null)).toBe(true);
  });
});

describe('semanaAnteriorISO / semanaSeguinteISO', () => {
  it('semana anterior volta 7 dias', () => {
    expect(semanaAnteriorISO('2026-08-10')).toBe('2026-08-03');
  });

  it('semana seguinte avança 7 dias quando ainda não é a semana atual', () => {
    const hoje = new Date(2026, 7, 17); // segunda seguinte
    expect(semanaSeguinteISO('2026-08-10', hoje)).toBe('2026-08-17');
  });

  it('retorna null quando a semana exibida já é a semana atual', () => {
    const hoje = new Date(2026, 7, 13); // quinta da mesma semana
    expect(semanaSeguinteISO('2026-08-10', hoje)).toBeNull();
  });

  it('retorna null em vez de avançar para uma semana futura', () => {
    const hoje = new Date(2026, 7, 10);
    expect(semanaSeguinteISO('2026-08-10', hoje)).toBeNull();
  });
});

describe('resolverSegundaFeira', () => {
  const hoje = new Date(2026, 7, 13); // quinta-feira, semana de 10 a 16

  it('usa a semana atual quando não há parâmetro', () => {
    expect(resolverSegundaFeira(undefined, hoje)).toBe('2026-08-10');
  });

  it('usa a semana atual quando o parâmetro é inválido', () => {
    expect(resolverSegundaFeira('nao-e-uma-data', hoje)).toBe('2026-08-10');
  });

  it('normaliza qualquer dia da semana pedida para a sua segunda-feira', () => {
    expect(resolverSegundaFeira('2026-08-05', hoje)).toBe('2026-08-03');
  });

  it('não permite semanas futuras — usa a semana atual como limite', () => {
    expect(resolverSegundaFeira('2026-08-24', hoje)).toBe('2026-08-10');
  });
});
