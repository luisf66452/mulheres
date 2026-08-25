import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SeletorObjetivos from './SeletorObjetivos';

const onSalvar = vi.fn(async (selecionados: string[]) => {
  void selecionados;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorObjetivos', () => {
  it('mostra as 7 opções, nenhuma selecionada por padrão', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('permite multi-seleção de objetivos normais', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Praticar autocompaixão' }));

    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('escolher "prefiro decidir depois" limpa qualquer seleção anterior e é exclusivo', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));

    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('escolher um objetivo normal depois de "prefiro decidir depois" desmarca o sentinela', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));

    expect(screen.getByRole('button', { name: 'Prefiro decidir depois' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Fortalecer minha autoestima' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('o botão de continuar nunca fica desabilitado — a etapa é sempre opcional', () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('ao confirmar, chama onSalvar com a seleção atual e depois aoSalvarComSucesso', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fortalecer minha autoestima' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(['fortalecer_autoestima']);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('em modo de edição (sem aoSalvarComSucesso), mostra confirmação "Salvo." em vez de avançar', async () => {
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} rotuloBotao="Salvar" />);

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/salvo/i)).toBeInTheDocument();
    });
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seus objetivos agora. Tente novamente.' });
    render(<SeletorObjetivos selecaoInicial={[]} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seus objetivos agora/i)).toBeInTheDocument();
    });
  });

  it('parte da seleção inicial informada (modo edição)', () => {
    render(<SeletorObjetivos selecaoInicial={['praticar_autocompaixao']} onSalvar={onSalvar} />);
    expect(screen.getByRole('button', { name: 'Praticar autocompaixão' })).toHaveAttribute('aria-pressed', 'true');
  });
});
