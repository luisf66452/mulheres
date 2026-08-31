// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';
import { confirmarCodigoAcesso, enviarLinkMagico } from './actions';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('./actions', () => ({
  enviarLinkMagico: vi.fn(),
  confirmarCodigoAcesso: vi.fn(),
}));

async function preencherEEnviarEmail() {
  fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
    target: { value: 'teste@rose.app' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /receber código de acesso/i }));
  await waitFor(() => expect(screen.getByPlaceholderText('000000')).toBeInTheDocument());
}

beforeEach(() => {
  vi.mocked(enviarLinkMagico).mockReset().mockResolvedValue({});
  vi.mocked(confirmarCodigoAcesso).mockReset();
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, href: '' },
  });
});

describe('LoginPage', () => {
  it('mostra o campo de código de 6 dígitos depois de pedir o acesso', async () => {
    render(<LoginPage />);

    await preencherEEnviarEmail();

    expect(enviarLinkMagico).toHaveBeenCalledWith('teste@rose.app');
    expect(screen.getByText(/teste@rose.app/)).toBeInTheDocument();
  });

  it('confirma o código e navega para a Início marcando o retorno do login', async () => {
    vi.mocked(confirmarCodigoAcesso).mockResolvedValue({});
    render(<LoginPage />);
    await preencherEEnviarEmail();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(confirmarCodigoAcesso).toHaveBeenCalledWith('teste@rose.app', '123456'));
    await waitFor(() => expect(window.location.href).toBe('/?entrada=1'));
  });

  it('mostra o erro e permite tentar de novo quando o código está errado', async () => {
    vi.mocked(confirmarCodigoAcesso).mockResolvedValue({ erro: 'Código inválido ou expirado. Peça um novo código.' });
    render(<LoginPage />);
    await preencherEEnviarEmail();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Código inválido ou expirado. Peça um novo código.')).toBeInTheDocument();
    expect(window.location.href).toBe('');
  });
});
