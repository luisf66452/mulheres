import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ExcluirContaFluxo from './ExcluirContaFluxo';

vi.mock('./actions', () => ({
  enviarConfirmacaoExclusao: vi.fn(async () => ({ emailEnviado: 'ana@exemplo.com' })),
}));

describe('ExcluirContaFluxo', () => {
  it('exige confirmação em duas etapas antes de qualquer envio', () => {
    render(<ExcluirContaFluxo />);
    expect(screen.queryByLabelText(/digite/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /excluir minha conta/i }));
    expect(screen.getByText(/esta ação é permanente/i)).toBeInTheDocument();
  });

  it('só habilita o botão final quando a frase digitada é exatamente EXCLUIR', () => {
    render(<ExcluirContaFluxo />);
    fireEvent.click(screen.getByRole('button', { name: /excluir minha conta/i }));
    fireEvent.click(screen.getByRole('button', { name: /entendi, continuar/i }));

    const campo = screen.getByRole('textbox');
    const botaoEnviar = screen.getByRole('button', { name: /enviar link de confirmação/i });

    expect(botaoEnviar).toBeDisabled();

    fireEvent.change(campo, { target: { value: 'excluir' } });
    expect(botaoEnviar).toBeDisabled();

    fireEvent.change(campo, { target: { value: 'EXCLUIR PLZ' } });
    expect(botaoEnviar).toBeDisabled();

    fireEvent.change(campo, { target: { value: 'EXCLUIR' } });
    expect(botaoEnviar).toBeEnabled();
  });

  it('permite cancelar e voltar ao estado inicial em qualquer etapa', () => {
    render(<ExcluirContaFluxo />);
    fireEvent.click(screen.getByRole('button', { name: /excluir minha conta/i }));
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(screen.getByRole('button', { name: /excluir minha conta/i })).toBeInTheDocument();
  });
});
