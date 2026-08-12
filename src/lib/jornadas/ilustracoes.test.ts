import { describe, it, expect } from 'vitest';
import { hashIlustracao, atribuirIlustracoes } from './ilustracoes';

describe('hashIlustracao', () => {
  it('é determinístico — o mesmo ID sempre retorna o mesmo índice', () => {
    expect(hashIlustracao('jornada-abc')).toBe(hashIlustracao('jornada-abc'));
  });

  it('retorna os índices esperados para IDs de um único caractere', () => {
    // soma dos code points de um único caractere é o próprio code point;
    // 'd'=100, 'e'=101, 'a'=97, 'b'=98, 'c'=99 — mod 5 dá 0,1,2,3,4 respectivamente.
    expect(hashIlustracao('d')).toBe(0);
    expect(hashIlustracao('e')).toBe(1);
    expect(hashIlustracao('a')).toBe(2);
    expect(hashIlustracao('b')).toBe(3);
    expect(hashIlustracao('c')).toBe(4);
  });
});

describe('atribuirIlustracoes', () => {
  it('mantém os índices originais quando os hashes de entrada não colidem', () => {
    const ids = ['d', 'e', 'a', 'b', 'c'];
    const atribuicoes = atribuirIlustracoes(ids);
    expect(atribuicoes.get('d')).toBe(0);
    expect(atribuicoes.get('e')).toBe(1);
    expect(atribuicoes.get('a')).toBe(2);
    expect(atribuicoes.get('b')).toBe(3);
    expect(atribuicoes.get('c')).toBe(4);
  });

  it('resolve colisão de hash atribuindo o próximo índice livre, quando há alternativa', () => {
    // 5 caracteres repetidos sempre somam um múltiplo de 5 → todos colidem no índice 0 do hash bruto.
    const ids = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee'];
    expect(ids.every((id) => hashIlustracao(id) === 0)).toBe(true);

    const atribuicoes = atribuirIlustracoes(ids);
    expect(ids.map((id) => atribuicoes.get(id))).toEqual([0, 1, 2, 3, 4]);
  });

  it('permite repetição a partir da 6ª jornada visível, quando não há mais índice livre', () => {
    const ids = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff'];
    expect(hashIlustracao('fffff')).toBe(0);

    const atribuicoes = atribuirIlustracoes(ids);
    expect(atribuicoes.get('fffff')).toBe(0);
  });

  it('é determinística — a mesma lista na mesma ordem produz a mesma atribuição', () => {
    const ids = ['aaaaa', 'bbbbb', 'ccccc'];
    expect(atribuirIlustracoes(ids)).toEqual(atribuirIlustracoes(ids));
  });
});
