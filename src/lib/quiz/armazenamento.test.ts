// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { salvarRespostasQuiz, lerRespostasQuiz, apagarRespostasQuiz } from './armazenamento';
import type { RespostasQuiz } from './tipos';

const RESPOSTAS: RespostasQuiz = {
  identificacao: 'evita_espelho',
  frequenciaEmocional: 'quase_todo_dia',
  objetivo: 'fortalecer_autoestima',
  temasSensiveis: ['alimentacao'],
  tempoDisponivel: '5_a_10min',
};

const OUTRAS_RESPOSTAS: RespostasQuiz = {
  identificacao: 'compara',
  frequenciaEmocional: 'de_vez_em_quando',
  objetivo: 'praticar_autocompaixao',
  temasSensiveis: ['comparacao'],
  tempoDisponivel: 'mais_10min',
};

beforeEach(() => {
  window.localStorage.clear();
  apagarRespostasQuiz();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('quiz — armazenamento', () => {
  it('salva e lê as respostas de volta intactas', () => {
    salvarRespostasQuiz(RESPOSTAS);
    expect(lerRespostasQuiz()).toEqual(RESPOSTAS);
  });

  it('retorna null quando não há nada salvo', () => {
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('retorna null para dado corrompido/inválido salvo na chave', () => {
    window.localStorage.setItem('rose:quiz-respostas', JSON.stringify({ objetivo: 'nao-existe' }));
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('apagarRespostasQuiz remove a chave', () => {
    salvarRespostasQuiz(RESPOSTAS);
    apagarRespostasQuiz();
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('retorna a MESMA referência em leituras consecutivas sem mudança (memoização p/ useSyncExternalStore)', () => {
    salvarRespostasQuiz(RESPOSTAS);
    const primeira = lerRespostasQuiz();
    const segunda = lerRespostasQuiz();
    expect(primeira).not.toBeNull();
    expect(primeira).toBe(segunda);
  });

  it('invalida o cache e retorna dados novos depois de um novo salvarRespostasQuiz', () => {
    salvarRespostasQuiz(RESPOSTAS);
    const antes = lerRespostasQuiz();

    salvarRespostasQuiz(OUTRAS_RESPOSTAS);
    const depois = lerRespostasQuiz();

    expect(depois).not.toBe(antes);
    expect(depois).toEqual(OUTRAS_RESPOSTAS);
  });

  it('salvarRespostasQuiz não lança quando localStorage.setItem lança (quota excedida/bloqueado)', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => salvarRespostasQuiz(RESPOSTAS)).not.toThrow();
  });

  it('lerRespostasQuiz não lança e retorna null quando localStorage.getItem lança', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    expect(() => lerRespostasQuiz()).not.toThrow();
    expect(lerRespostasQuiz()).toBeNull();
  });

  it('apagarRespostasQuiz não lança quando localStorage.removeItem lança', () => {
    salvarRespostasQuiz(RESPOSTAS);
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    expect(() => apagarRespostasQuiz()).not.toThrow();
  });
});
