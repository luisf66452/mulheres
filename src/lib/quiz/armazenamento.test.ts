// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { salvarRespostasQuiz, lerRespostasQuiz, apagarRespostasQuiz } from './armazenamento';
import type { RespostasQuiz } from './tipos';

const RESPOSTAS: RespostasQuiz = {
  identificacao: 'evita_espelho',
  frequenciaEmocional: 'quase_todo_dia',
  objetivo: 'fortalecer_autoestima',
  temasSensiveis: ['alimentacao'],
  tempoDisponivel: '5_a_10min',
};

beforeEach(() => {
  window.localStorage.clear();
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
});
