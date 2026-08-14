import { describe, it, expect } from 'vitest';
import { PRATICAS_RAPIDAS, obterPraticaPorId } from './dados';

describe('PRATICAS_RAPIDAS', () => {
  it('tem exatamente as 4 práticas rápidas, na ordem do mockup', () => {
    expect(PRATICAS_RAPIDAS.map((pratica) => pratica.id)).toEqual([
      'respiracao',
      'diario-guiado',
      'meditacao',
      'autocompaixao',
    ]);
  });
});

describe('obterPraticaPorId', () => {
  it('retorna a prática correta para cada slug conhecido', () => {
    expect(obterPraticaPorId('respiracao')?.titulo).toBe('Respiração');
    expect(obterPraticaPorId('diario-guiado')?.titulo).toBe('Diário guiado');
    expect(obterPraticaPorId('meditacao')?.titulo).toBe('Meditação');
    expect(obterPraticaPorId('autocompaixao')?.titulo).toBe('Exercício de autocompaixão');
  });

  it('retorna undefined para um slug desconhecido', () => {
    expect(obterPraticaPorId('inexistente')).toBeUndefined();
  });
});
