import { describe, it, expect } from 'vitest';
import { ehDeepLinkSeguro, deepLinkSeguro } from './deepLink';

describe('ehDeepLinkSeguro', () => {
  it('aceita caminhos relativos', () => {
    expect(ehDeepLinkSeguro('/jornadas/autoestima/sessao-1')).toBe(true);
    expect(ehDeepLinkSeguro('/inicio')).toBe(true);
  });

  it('rejeita URLs absolutas', () => {
    expect(ehDeepLinkSeguro('https://evil.example.com/phish')).toBe(false);
    expect(ehDeepLinkSeguro('http://evil.example.com')).toBe(false);
  });

  it('rejeita URLs protocolo-relativas ("//")', () => {
    expect(ehDeepLinkSeguro('//evil.example.com')).toBe(false);
  });

  it('rejeita strings que nao comecam com barra', () => {
    expect(ehDeepLinkSeguro('jornadas/autoestima')).toBe(false);
    expect(ehDeepLinkSeguro('')).toBe(false);
  });
});

describe('deepLinkSeguro', () => {
  it('devolve a propria url quando segura', () => {
    expect(deepLinkSeguro('/jornadas/x')).toBe('/jornadas/x');
  });

  it('cai no fallback quando insegura ou ausente', () => {
    expect(deepLinkSeguro('https://evil.example.com')).toBe('/inicio');
    expect(deepLinkSeguro(null)).toBe('/inicio');
    expect(deepLinkSeguro(undefined)).toBe('/inicio');
    expect(deepLinkSeguro('//evil.example.com', '/checkin')).toBe('/checkin');
  });
});
