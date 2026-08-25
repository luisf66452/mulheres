// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rastrearEvento, rastrearPageView, jaDisparado, marcarDisparado } from './eventos';

beforeEach(() => {
  window.localStorage.clear();
  delete (window as unknown as { fbq?: unknown }).fbq;
});

afterEach(() => {
  delete (window as unknown as { fbq?: unknown }).fbq;
});

describe('rastrearEvento', () => {
  it('não faz nada quando window.fbq ainda não foi carregado (ex.: sem consentimento)', () => {
    expect(() => rastrearEvento('CompleteRegistration', {})).not.toThrow();
  });

  it('chama fbq("track", evento, params) quando o pixel está carregado', () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    rastrearEvento('Subscribe', { value: 19.9, currency: 'BRL' });

    expect(chamadas).toEqual([['track', 'Subscribe', { value: 19.9, currency: 'BRL' }]]);
  });
});

describe('rastrearPageView', () => {
  it('não faz nada quando window.fbq ainda não foi carregado', () => {
    expect(() => rastrearPageView()).not.toThrow();
  });

  it('chama fbq("track", "PageView") quando o pixel está carregado', () => {
    const chamadas: unknown[][] = [];
    window.fbq = (...args: unknown[]) => chamadas.push(args);

    rastrearPageView();

    expect(chamadas).toEqual([['track', 'PageView']]);
  });
});

describe('jaDisparado / marcarDisparado', () => {
  it('retorna false para uma chave nunca marcada', () => {
    expect(jaDisparado('complete_registration')).toBe(false);
  });

  it('retorna true depois de marcarDisparado', () => {
    marcarDisparado('subscribe:sess_123');
    expect(jaDisparado('subscribe:sess_123')).toBe(true);
  });

  it('usa chaves independentes por transação', () => {
    marcarDisparado('subscribe:sess_123');
    expect(jaDisparado('subscribe:sess_456')).toBe(false);
  });
});
