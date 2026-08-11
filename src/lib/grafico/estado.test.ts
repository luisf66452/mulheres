import { describe, it, expect } from 'vitest';
import { decidirEstadoGrafico } from './estado';

describe('decidirEstadoGrafico', () => {
  it('retorna sem_dados quando não há check-ins', () => {
    expect(decidirEstadoGrafico(0)).toBe('sem_dados');
  });

  it('retorna poucos_dados com exatamente 1 check-in', () => {
    expect(decidirEstadoGrafico(1)).toBe('poucos_dados');
  });

  it('retorna com_tendencia com 2 check-ins', () => {
    expect(decidirEstadoGrafico(2)).toBe('com_tendencia');
  });

  it('retorna com_tendencia com muitos check-ins', () => {
    expect(decidirEstadoGrafico(30)).toBe('com_tendencia');
  });
});
