import { describe, it, expect, beforeEach } from 'vitest';
import { obterVistas, registrarVistas } from './armazenamentoVistas';

describe('obterVistas / registrarVistas', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('retorna conjunto vazio quando nada foi visto ainda', () => {
    expect(obterVistas('u1').size).toBe(0);
  });

  it('registra conquistas vistas e as retorna depois', () => {
    registrarVistas('u1', ['sequencia-7-dias']);
    expect(obterVistas('u1').has('sequencia-7-dias')).toBe(true);
  });

  it('acumula vistas em chamadas sucessivas sem perder as anteriores', () => {
    registrarVistas('u1', ['sequencia-7-dias']);
    registrarVistas('u1', ['checkins-5']);
    const vistas = obterVistas('u1');
    expect(vistas.has('sequencia-7-dias')).toBe(true);
    expect(vistas.has('checkins-5')).toBe(true);
  });

  it('não mistura conquistas vistas de usuárias diferentes', () => {
    registrarVistas('u1', ['sequencia-7-dias']);
    registrarVistas('u2', ['checkins-5']);
    expect(obterVistas('u1').has('checkins-5')).toBe(false);
    expect(obterVistas('u2').has('sequencia-7-dias')).toBe(false);
  });
});
