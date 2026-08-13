import { describe, it, expect } from 'vitest';
import { obterIniciais } from './iniciais';

describe('obterIniciais', () => {
  it('usa a primeira letra de nome e sobrenome quando há dois ou mais nomes', () => {
    expect(obterIniciais('Maria Clara')).toBe('MC');
  });

  it('usa só a primeira letra quando há apenas um nome', () => {
    expect(obterIniciais('Sofia')).toBe('S');
  });

  it('ignora nomes do meio, usando primeiro e último', () => {
    expect(obterIniciais('Ana Beatriz Souza')).toBe('AS');
  });

  it('retorna fallback quando o nome é null', () => {
    expect(obterIniciais(null)).toBe('?');
  });

  it('retorna fallback quando o nome é string vazia ou só espaços', () => {
    expect(obterIniciais('')).toBe('?');
    expect(obterIniciais('   ')).toBe('?');
  });

  it('sempre retorna maiúsculas', () => {
    expect(obterIniciais('maria clara')).toBe('MC');
  });

  it('ignora espaços extras entre os nomes', () => {
    expect(obterIniciais('  Maria   Clara  ')).toBe('MC');
  });
});
