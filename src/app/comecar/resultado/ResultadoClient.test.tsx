// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultadoClient from './ResultadoClient';
import { lerRespostasQuiz } from '@/lib/quiz/armazenamento';

const replace = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('@/lib/quiz/armazenamento', () => ({
  lerRespostasQuiz: vi.fn(),
}));

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  vi.mocked(lerRespostasQuiz).mockReset();
});

describe('ResultadoClient', () => {
  it('renderiza headline, validação, ajuste e confirmação com base nas respostas salvas', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'evita_espelho',
      frequenciaEmocional: 'quase_todo_dia',
      objetivo: 'fortalecer_autoestima',
      temasSensiveis: ['alimentacao'],
      tempoDisponivel: '5_a_10min',
    });

    render(<ResultadoClient precoMensal="R$ 39,99" precoAnual="R$ 359,99" percentualEconomiaAnual={25} />);

    expect(screen.getByText(/Seu plano: Fortalecer sua autoestima/i)).toBeInTheDocument();
    expect(screen.getByText(/não é falta de força de vontade/i)).toBeInTheDocument();
    expect(screen.getByText(/sem dieta, sem contagem, sem julgamento/i)).toBeInTheDocument();
    expect(screen.getByText(/5 a 10 minutos por dia/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 39,99/)).toBeInTheDocument();
    expect(screen.getByText(/economize 25%/i)).toBeInTheDocument();
  });

  it('redireciona pro quiz quando não há respostas salvas', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue(null);

    render(<ResultadoClient precoMensal={null} precoAnual={null} percentualEconomiaAnual={null} />);

    expect(replace).toHaveBeenCalledWith('/comecar');
  });

  it('leva pro login ao clicar em "Quero começar agora"', () => {
    vi.mocked(lerRespostasQuiz).mockReturnValue({
      identificacao: 'compara',
      frequenciaEmocional: 'raramente',
      objetivo: 'criar_ritual_diario',
      temasSensiveis: [],
      tempoDisponivel: 'menos_5min',
    });

    render(<ResultadoClient precoMensal={null} precoAnual={null} percentualEconomiaAnual={null} />);
    screen.getByRole('button', { name: /quero começar agora/i }).click();

    expect(push).toHaveBeenCalledWith('/login');
  });
});
