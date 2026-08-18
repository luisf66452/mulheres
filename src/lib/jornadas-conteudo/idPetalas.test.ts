import { describe, it, expect } from 'vitest';
import { idPetalasParaSessao } from './idPetalas';

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/;

describe('idPetalasParaSessao', () => {
  it('produz um uuid válido a partir de um id de sessão', () => {
    expect(idPetalasParaSessao('imagem-corporal-m1-s1')).toMatch(REGEX_UUID);
  });

  it('é determinístico: o mesmo id de sessão sempre produz o mesmo uuid', () => {
    const a = idPetalasParaSessao('autocompaixao-m3-s2');
    const b = idPetalasParaSessao('autocompaixao-m3-s2');
    expect(a).toBe(b);
  });

  it('produz uuids diferentes para ids de sessão diferentes', () => {
    const a = idPetalasParaSessao('comparacao-m1-s1');
    const b = idPetalasParaSessao('comparacao-m1-s2');
    expect(a).not.toBe(b);
  });
});
