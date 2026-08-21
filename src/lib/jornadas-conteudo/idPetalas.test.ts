import { describe, expect, it } from 'vitest';
import { idPetalasParaSessao } from './idPetalas';

describe('idPetalasParaSessao', () => {
  it('é determinístico para o mesmo id de sessão', () => {
    expect(idPetalasParaSessao('imagem-corporal-m1-s1')).toBe(idPetalasParaSessao('imagem-corporal-m1-s1'));
  });

  it('gera valores diferentes para sessões diferentes', () => {
    expect(idPetalasParaSessao('imagem-corporal-m1-s1')).not.toBe(idPetalasParaSessao('imagem-corporal-m1-s2'));
  });

  it('produz um uuid v4/v5 válido em formato', () => {
    expect(idPetalasParaSessao('comparacao-m1-s1')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});
