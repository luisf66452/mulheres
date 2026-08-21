import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PreviewJornadaRascunhoClient from './PreviewJornadaRascunhoClient';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const ativarJornadaRascunhoPreview = vi.fn();
const liberarProximoDiaQA = vi.fn(async () => ({}));
const voltarDiaAnteriorQA = vi.fn(async () => ({}));
const reiniciarProgressoQA = vi.fn(async () => ({}));
vi.mock('./actions', () => ({
  ativarJornadaRascunhoPreview: () => ativarJornadaRascunhoPreview(),
  liberarProximoDiaQA: () => liberarProximoDiaQA(),
  voltarDiaAnteriorQA: () => voltarDiaAnteriorQA(),
  reiniciarProgressoQA: () => reiniciarProgressoQA(),
}));

beforeEach(() => {
  refresh.mockClear();
  ativarJornadaRascunhoPreview.mockReset();
  liberarProximoDiaQA.mockClear();
});

describe('PreviewJornadaRascunhoClient — bug real reproduzido e corrigido', () => {
  it('clicar em ativar: sai do estado de carregamento, sem erro, e aciona router.refresh() — não fica travado igual ao bug relatado', async () => {
    ativarJornadaRascunhoPreview.mockResolvedValue({});
    render(<PreviewJornadaRascunhoClient inscrita={false} diasCompletados={0} statusInscricao={null} />);

    const botao = screen.getByRole('button', { name: /ativar jornada de rascunho/i });
    fireEvent.click(botao);

    expect(screen.getByRole('button', { name: /ativando/i })).toBeDisabled();

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    // O botão sempre sai do estado de carregamento, com sucesso ou erro.
    await waitFor(() => {
      expect(screen.queryByText(/ativando\.\.\./i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/não foi possível/i)).not.toBeInTheDocument();
  });

  it('depois do refresh (props atualizadas pelo server), o painel muda para o estado ativo sem precisar de reload manual', async () => {
    ativarJornadaRascunhoPreview.mockResolvedValue({});
    const { rerender } = render(
      <PreviewJornadaRascunhoClient inscrita={false} diasCompletados={0} statusInscricao={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /ativar jornada de rascunho/i }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    // Simula exatamente o que router.refresh() faz no app real: o Server
    // Component (page.tsx) roda de novo, busca jornadas_usuarias atualizado
    // e passa `inscrita=true` como nova prop — sem window.location.reload().
    rerender(<PreviewJornadaRascunhoClient inscrita={true} diasCompletados={0} statusInscricao="em_andamento" />);

    expect(screen.getByText(/progresso de teste/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir para o check-in de hoje/i })).toHaveAttribute('href', '/checkin');
    expect(screen.queryByRole('button', { name: /ativar jornada de rascunho/i })).not.toBeInTheDocument();
  });

  it('mostra um aviso claro quando a action pausa outra jornada ativa para liberar a de teste', async () => {
    ativarJornadaRascunhoPreview.mockResolvedValue({ pausouOutraJornada: true });
    render(<PreviewJornadaRascunhoClient inscrita={false} diasCompletados={0} statusInscricao={null} />);

    fireEvent.click(screen.getByRole('button', { name: /ativar jornada de rascunho/i }));

    await waitFor(() => {
      expect(screen.getByText(/outra jornada.*foi pausada/i)).toBeInTheDocument();
    });
  });

  it('qualquer falha real aparece em mensagem clara, e o botão sai do carregamento mesmo assim', async () => {
    ativarJornadaRascunhoPreview.mockResolvedValue({ erro: 'Não foi possível ativar a jornada de teste agora. Tente novamente.' });
    render(<PreviewJornadaRascunhoClient inscrita={false} diasCompletados={0} statusInscricao={null} />);

    fireEvent.click(screen.getByRole('button', { name: /ativar jornada de rascunho/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível ativar/i);
    });
    expect(screen.getByRole('button', { name: /ativar jornada de rascunho/i })).toBeEnabled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('painel ativo tem um botão funcional para ir ao /checkin', () => {
    render(<PreviewJornadaRascunhoClient inscrita={true} diasCompletados={2} statusInscricao="em_andamento" />);
    const link = screen.getByRole('link', { name: /ir para o check-in de hoje/i });
    expect(link).toHaveAttribute('href', '/checkin');
  });
});
