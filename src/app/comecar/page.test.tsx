// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComecarPage from './page';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const salvarRespostasQuiz = vi.fn();
vi.mock('@/lib/quiz/armazenamento', () => ({
  salvarRespostasQuiz: (respostas: unknown) => salvarRespostasQuiz(respostas),
}));

beforeEach(() => {
  push.mockClear();
  salvarRespostasQuiz.mockClear();
});

describe('ComecarPage (quiz)', () => {
  it('percorre as 5 perguntas e salva as respostas antes de navegar pro resultado', () => {
    render(<ComecarPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Eu evito me olhar no espelho' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quase todo dia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alimentação' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    fireEvent.click(screen.getByRole('button', { name: '5 a 10 minutos' }));

    expect(salvarRespostasQuiz).toHaveBeenCalledWith({
      identificacao: 'evita_espelho',
      frequenciaEmocional: 'quase_todo_dia',
      objetivo: 'fortalecer_autoestima',
      temasSensiveis: ['alimentacao'],
      tempoDisponivel: '5_a_10min',
    });
    expect(push).toHaveBeenCalledWith('/comecar/resultado');
  });

  it('permite pular temas sensíveis sem marcar nenhum', () => {
    render(<ComecarPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Eu já cuido de mim, mas quero ir mais fundo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raramente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar um ritual diário de cuidado' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Menos de 5 minutos' }));

    expect(salvarRespostasQuiz).toHaveBeenCalledWith(expect.objectContaining({ temasSensiveis: [] }));
  });
});
