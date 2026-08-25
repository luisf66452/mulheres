import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SeletorTemasSensiveis from './SeletorTemasSensiveis';

const onSalvar = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorTemasSensiveis', () => {
  it('mostra as 6 opções, nenhuma selecionada por padrão', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Prefiro não responder' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('permite multi-seleção de temas normais', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo e aparência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comparação' }));

    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Comparação' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"nenhum desses" é exclusivo — limpa outras seleções e é limpo por elas', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo e aparência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nenhum desses' }));

    expect(screen.getByRole('button', { name: 'Corpo e aparência' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Alimentação' }));
    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Alimentação' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"prefiro não responder" é exclusivo com "nenhum desses" e com os temas normais', () => {
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nenhum desses' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro não responder' }));

    expect(screen.getByRole('button', { name: 'Nenhum desses' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Prefiro não responder' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ao confirmar, chama onSalvar com a seleção atual e depois aoSalvarComSucesso', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: 'Autocrítica' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(['autocritica']);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seus temas agora. Tente novamente.' });
    render(<SeletorTemasSensiveis selecaoInicial={[]} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seus temas agora/i)).toBeInTheDocument();
    });
  });
});
