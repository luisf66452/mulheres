// @vitest-environment jsdom
//
// Regressão do Critical #1 (loop infinito de render): esta suíte NÃO mocka
// @/lib/quiz/armazenamento — usa o localStorage real via salvarRespostasQuiz
// para provar que useSyncExternalStore + lerRespostasQuiz (com a memoização
// de referência estável) funcionam de ponta a ponta, sem lançar o aviso do
// React de "Maximum update depth exceeded" (loop infinito de getSnapshot).
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ResultadoClient from './ResultadoClient';
import { salvarRespostasQuiz, apagarRespostasQuiz } from '@/lib/quiz/armazenamento';
import type { RespostasQuiz } from '@/lib/quiz/tipos';

const replace = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

const RESPOSTAS: RespostasQuiz = {
  identificacao: 'evita_espelho',
  frequenciaEmocional: 'quase_todo_dia',
  objetivo: 'fortalecer_autoestima',
  temasSensiveis: ['alimentacao'],
  tempoDisponivel: '5_a_10min',
};

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  window.localStorage.clear();
  apagarRespostasQuiz();
});

afterEach(() => {
  window.localStorage.clear();
  apagarRespostasQuiz();
});

describe('ResultadoClient — integração com localStorage real (sem mock de armazenamento)', () => {
  it('renderiza a headline a partir de respostas reais salvas, sem loop infinito de render', () => {
    const erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    salvarRespostasQuiz(RESPOSTAS);

    expect(() =>
      render(<ResultadoClient precoMensal={null} precoAnual={null} percentualEconomiaAnual={null} />)
    ).not.toThrow();

    expect(screen.getByText(/Seu plano: Fortalecer sua autoestima/i)).toBeInTheDocument();

    const avisoDeLoop = erroConsole.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && /Maximum update depth exceeded/i.test(arg))
    );
    expect(avisoDeLoop).toBe(false);

    erroConsole.mockRestore();
  });
});
