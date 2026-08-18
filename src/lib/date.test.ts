import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDateISO, hojeISONoFuso, hojeNoFuso } from './date';

describe('formatDateISO', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2026, 7, 10); // month is 0-indexed: August
    expect(formatDateISO(d)).toBe('2026-08-10');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5); // January 5
    expect(formatDateISO(d)).toBe('2026-01-05');
  });
});

describe('hojeISONoFuso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa a data do fuso da usuária, não a do relógio do servidor (UTC)', () => {
    // 02:00 UTC de 2026-08-11 já é 23:00 de 2026-08-10 em São Paulo (UTC-3) —
    // sem converter pro fuso da usuária, um servidor rodando em UTC gravaria
    // o check-in dela com a data errada.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T02:00:00.000Z'));

    expect(hojeISONoFuso('America/Sao_Paulo')).toBe('2026-08-10');
    expect(hojeISONoFuso('UTC')).toBe('2026-08-11');
  });

  it('já é o dia seguinte em Lisboa quando ainda não é em São Paulo', () => {
    // 01:00 UTC: já é madrugada em Lisboa (UTC+1 no verão), mas ainda é a
    // noite anterior em São Paulo.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T01:00:00.000Z'));

    expect(hojeISONoFuso('Europe/Lisbon')).toBe('2026-08-11');
    expect(hojeISONoFuso('America/Sao_Paulo')).toBe('2026-08-10');
  });

  it('cai de volta ao horário do servidor se o fuso for inválido, sem quebrar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T12:00:00.000Z'));

    expect(hojeISONoFuso('fuso-que-nao-existe')).toBe(formatDateISO(new Date()));
  });
});

describe('hojeNoFuso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna um Date cuja formatDateISO bate com hojeISONoFuso', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T02:00:00.000Z'));

    expect(formatDateISO(hojeNoFuso('America/Sao_Paulo'))).toBe('2026-08-10');
  });
});
