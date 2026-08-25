import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lerPosicao, salvarPosicao, apagarPosicao } from './armazenamento';

function limparStorage() {
  window.localStorage.clear();
}

describe('salvarPosicao / lerPosicao', () => {
  beforeEach(limparStorage);

  it('retorna null quando não há posição salva', () => {
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });

  it('salva e recupera a posição em segundos de uma prática específica', () => {
    salvarPosicao('respiracao-guiada', 42);
    expect(lerPosicao('respiracao-guiada')).toBe(42);
  });

  it('mantém posições de práticas diferentes isoladas entre si', () => {
    salvarPosicao('respiracao-guiada', 42);
    salvarPosicao('aterramento-guiado', 10);
    expect(lerPosicao('respiracao-guiada')).toBe(42);
    expect(lerPosicao('aterramento-guiado')).toBe(10);
  });

  it('ignora entrada corrompida no localStorage em vez de lançar', () => {
    window.localStorage.setItem('rose:audio-posicao:respiracao-guiada', '{not json');
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });
});

describe('apagarPosicao', () => {
  beforeEach(limparStorage);

  it('remove a posição salva de uma prática', () => {
    salvarPosicao('respiracao-guiada', 42);
    apagarPosicao('respiracao-guiada');
    expect(lerPosicao('respiracao-guiada')).toBeNull();
  });

  it('não lança erro ao apagar uma posição que nunca existiu', () => {
    expect(() => apagarPosicao('inexistente')).not.toThrow();
  });
});

describe('ambiente sem window', () => {
  it('lerPosicao retorna null sem lançar quando localStorage não está disponível', () => {
    const original = window.localStorage;
    // @ts-expect-error simula ambiente sem localStorage (ex.: SSR)
    delete window.localStorage;
    expect(() => lerPosicao('respiracao-guiada')).not.toThrow();
    expect(lerPosicao('respiracao-guiada')).toBeNull();
    Object.defineProperty(window, 'localStorage', { value: original, configurable: true });
  });
});
