import { describe, it, expect } from 'vitest';
import { escolherMensagem } from './mensagens';

describe('escolherMensagem', () => {
  it('sempre usa o titulo Rose', () => {
    expect(escolherMensagem('sessao_abandonada', 'sessao_abandonada:1').titulo).toBe('Rose');
  });

  it('e deterministica: a mesma dedup_key sempre produz a mesma mensagem', () => {
    const a = escolherMensagem('inatividade', 'inatividade_3d:2026-08-10');
    const b = escolherMensagem('inatividade', 'inatividade_3d:2026-08-10');
    expect(a).toEqual(b);
  });

  it('nunca contem palavras de culpa/pressao proibidas', () => {
    const proibidas = ['atrasada', 'não desista', 'desista', 'deveria', 'precisa'];
    const categorias = ['sessao_abandonada', 'sessao_disponivel', 'praticas_pendente', 'inatividade', 'continuidade'] as const;
    for (const categoria of categorias) {
      for (const dedupKey of ['a', 'b', 'c']) {
        const mensagem = escolherMensagem(categoria, dedupKey).corpo.toLowerCase();
        for (const proibida of proibidas) {
          expect(mensagem).not.toContain(proibida);
        }
      }
    }
  });

  it('produz pelo menos duas variacoes distintas para a mesma categoria', () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 20; i++) {
      vistas.add(escolherMensagem('sessao_disponivel', `chave-${i}`).corpo);
    }
    expect(vistas.size).toBeGreaterThan(1);
  });
});
