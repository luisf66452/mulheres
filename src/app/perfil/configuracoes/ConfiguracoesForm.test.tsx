import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ConfiguracoesForm from './ConfiguracoesForm';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

vi.mock('./actions', () => ({
  atualizarFusoHorario: vi.fn(async () => ({ sucesso: true })),
}));

vi.mock('@/lib/pwa/usePwaInstall', () => ({
  usePwaInstall: vi.fn(),
}));

const usePwaInstallMock = vi.mocked(usePwaInstall);

const USUARIA_A = 'usuaria-config-a';
const USUARIA_B = 'usuaria-config-b';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-tema');
  document.documentElement.removeAttribute('data-tamanho-texto');
  document.documentElement.removeAttribute('data-reduzir-animacoes');
  usePwaInstallMock.mockReturnValue({
    podeInstalar: false,
    ehIOS: false,
    ehStandalone: false,
    foiDispensado: false,
    instalar: vi.fn(),
    dispensar: vi.fn(),
  });
});

describe('ConfiguracoesForm', () => {
  it('não exibe toggles de sons/reprodução automática (sem efeito real no app)', () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    expect(screen.queryByText(/^Sons$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reprodução automática/i)).not.toBeInTheDocument();
  });

  it('não exibe idioma como seletor falso, e mostra Português como informação', () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    expect(screen.queryByRole('combobox', { name: /idioma/i })).not.toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
  });

  it('inclui fusos de Portugal e Brasil no seletor', () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    const select = screen.getByRole('combobox', { name: /fuso horário/i });
    const opcoes = Array.from(select.querySelectorAll('option')).map((o) => o.getAttribute('value'));
    expect(opcoes).toContain('Europe/Lisbon');
    expect(opcoes).toContain('Atlantic/Azores');
    expect(opcoes).toContain('America/Sao_Paulo');
  });

  it('altera data-tamanho-texto no elemento raiz ao clicar em "Grande"', async () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Grande' }));
    expect(document.documentElement.getAttribute('data-tamanho-texto')).toBe('grande');
  });

  it('altera data-reduzir-animacoes ao marcar o checkbox', async () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    const checkbox = await screen.findByRole('checkbox', { name: /reduzir animações/i });
    fireEvent.click(checkbox);
    expect(document.documentElement.getAttribute('data-reduzir-animacoes')).toBe('true');
  });

  it('altera data-tema ao escolher "Escura"', async () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Escura' }));
    expect(document.documentElement.getAttribute('data-tema')).toBe('escura');
  });

  it('isola as preferências salvas entre duas usuárias diferentes no mesmo dispositivo', async () => {
    const { unmount } = render(
      <ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Maior' }));
    await waitFor(() =>
      expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_A}`)).toContain('maior')
    );
    unmount();

    render(<ConfiguracoesForm usuariaId={USUARIA_B} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    await waitFor(() => expect(document.documentElement.getAttribute('data-tamanho-texto')).toBe('padrao'));
    expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_B}`)).toBeNull();
  });

  it('limpar dados temporários não remove as preferências de aparência do dispositivo', async () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Maior' }));
    await waitFor(() =>
      expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_A}`)).toContain('maior')
    );

    fireEvent.click(screen.getByRole('button', { name: /limpar dados temporários/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar limpeza/i }));

    expect(window.localStorage.getItem(`perfil:configuracoes-dispositivo:${USUARIA_A}`)).toContain('maior');
    expect(screen.getByRole('status')).toHaveTextContent(/não foram afetadas|não havia dados/i);
  });

  it('limpar dados temporários não toca em chaves de outra usuária', async () => {
    window.localStorage.setItem(`conquistas:vistas:${USUARIA_B}`, JSON.stringify(['x']));
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);

    fireEvent.click(screen.getByRole('button', { name: /limpar dados temporários/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar limpeza/i }));

    expect(window.localStorage.getItem(`conquistas:vistas:${USUARIA_B}`)).not.toBeNull();
  });

  it('renderiza o ponto de entrada de instalacao do PWA', () => {
    usePwaInstallMock.mockReturnValue({
      podeInstalar: true,
      ehIOS: false,
      ehStandalone: false,
      foiDispensado: false,
      instalar: vi.fn(),
      dispensar: vi.fn(),
    });
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    expect(screen.getByLabelText('Instalar a Rose')).toBeInTheDocument();
  });

  it('o botão de salvar fuso fica desabilitado até o valor mudar', () => {
    render(<ConfiguracoesForm usuariaId={USUARIA_A} fusoHorarioAtual="America/Sao_Paulo" versaoApp="1.0.0" />);
    expect(screen.getByRole('button', { name: /salvar fuso horário/i })).toBeDisabled();

    fireEvent.change(screen.getByRole('combobox', { name: /fuso horário/i }), {
      target: { value: 'Europe/Lisbon' },
    });
    expect(screen.getByRole('button', { name: /salvar fuso horário/i })).toBeEnabled();
  });
});
