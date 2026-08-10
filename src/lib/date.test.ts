import { describe, it, expect } from 'vitest';
import { formatDateISO } from './date';

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
