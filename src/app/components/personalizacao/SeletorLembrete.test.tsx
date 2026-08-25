import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import SeletorLembrete from './SeletorLembrete';

const onSalvar = vi.fn(async (horario: string | null) => {
  void horario;
  return {};
});

beforeEach(() => {
  onSalvar.mockClear();
});

describe('SeletorLembrete', () => {
  it('mostra um input de horário com valor padrão quando não há horário inicial', () => {
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} />);
    expect(screen.getByLabelText(/horário/i)).toHaveValue('09:00');
  });

  it('parte do horário inicial informado (modo edição)', () => {
    render(<SeletorLembrete horarioInicial="19:30" onSalvar={onSalvar} />);
    expect(screen.getByLabelText(/horário/i)).toHaveValue('19:30');
  });

  it('confirmar com horário chama onSalvar com a string do horário', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.change(screen.getByLabelText(/horário/i), { target: { value: '08:00' } });
    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith('08:00');
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('"não quero lembretes agora" chama onSalvar com null, nunca com uma string', async () => {
    const aoSalvarComSucesso = vi.fn();
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} aoSalvarComSucesso={aoSalvarComSucesso} />);

    fireEvent.click(screen.getByRole('button', { name: /não quero lembretes agora/i }));

    await waitFor(() => {
      expect(onSalvar).toHaveBeenCalledWith(null);
      expect(aoSalvarComSucesso).toHaveBeenCalledTimes(1);
    });
  });

  it('nunca referencia a API Notification do navegador em nenhum lugar do arquivo (incluindo imports)', () => {
    const caminhoArquivo = join(dirname(fileURLToPath(import.meta.url)), 'SeletorLembrete.tsx');
    const codigoFonte = readFileSync(caminhoArquivo, 'utf-8');
    expect(codigoFonte).not.toMatch(/Notification/);
  });

  it('mostra erro retornado por onSalvar sem travar a tela', async () => {
    onSalvar.mockResolvedValueOnce({ erro: 'Não foi possível salvar seu lembrete agora. Tente novamente.' });
    render(<SeletorLembrete horarioInicial={null} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível salvar seu lembrete agora/i)).toBeInTheDocument();
    });
  });
});
