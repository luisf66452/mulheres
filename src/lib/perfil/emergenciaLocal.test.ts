import { describe, it, expect } from 'vitest';
import { NUMERO_EMERGENCIA_LOCAL } from './emergenciaLocal';
import { PAISES_SUPORTADOS } from './pais';

describe('NUMERO_EMERGENCIA_LOCAL', () => {
  it('tem uma entrada para todo país suportado', () => {
    for (const pais of PAISES_SUPORTADOS) {
      expect(NUMERO_EMERGENCIA_LOCAL[pais]).toBeDefined();
      expect(NUMERO_EMERGENCIA_LOCAL[pais].numero.length).toBeGreaterThan(0);
      expect(NUMERO_EMERGENCIA_LOCAL[pais].rotulo.length).toBeGreaterThan(0);
    }
  });

  it('PT aponta para o 112 (número europeu de emergência)', () => {
    expect(NUMERO_EMERGENCIA_LOCAL.PT.numero).toBe('112');
  });

  it('BR aponta para o 192 (SAMU)', () => {
    expect(NUMERO_EMERGENCIA_LOCAL.BR.numero).toBe('192');
  });
});
