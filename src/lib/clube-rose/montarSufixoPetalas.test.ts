import { describe, it, expect } from 'vitest';
import { montarSufixoPetalas } from './montarSufixoPetalas';

describe('montarSufixoPetalas', () => {
  it('retorna string vazia quando nenhum flag está presente', () => {
    const sufixo = montarSufixoPetalas({ total: 0, limiteGratuitoAtingido: false });
    expect(sufixo).toBe('');
  });

  it('retorna apenas ?petalas=N quando só há total > 0', () => {
    const sufixo = montarSufixoPetalas({ total: 10, limiteGratuitoAtingido: false });
    expect(sufixo).toBe('?petalas=10');
  });

  it('retorna apenas ?limitePetalas=1 quando só o limite foi atingido', () => {
    const sufixo = montarSufixoPetalas({ total: 0, limiteGratuitoAtingido: true });
    expect(sufixo).toBe('?limitePetalas=1');
  });

  it('retorna ?petalas=N&limitePetalas=1 quando ambos estão presentes', () => {
    const sufixo = montarSufixoPetalas({ total: 10, limiteGratuitoAtingido: true });
    expect(sufixo).toBe('?petalas=10&limitePetalas=1');
  });
});
