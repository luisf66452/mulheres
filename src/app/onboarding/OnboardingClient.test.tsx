import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import OnboardingClient from './OnboardingClient';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const registrarConsentimento = vi.fn(async (nome?: string): Promise<{ erro?: string }> => {
  void nome;
  return {};
});
const confirmarPais = vi.fn(async (pais: string): Promise<{ erro?: string }> => {
  void pais;
  return {};
});
const salvarObjetivos = vi.fn(async (selecionados: string[]): Promise<{ erro?: string }> => {
  void selecionados;
  return {};
});
const salvarTemasSensiveis = vi.fn(async (selecionados: string[]): Promise<{ erro?: string }> => {
  void selecionados;
  return {};
});
const concluirPersonalizacao = vi.fn(async (horario: string | null): Promise<{ erro?: string }> => {
  void horario;
  return {};
});
vi.mock('./actions', () => ({
  registrarConsentimento: (nome?: string) => registrarConsentimento(nome),
  confirmarPais: (pais: string) => confirmarPais(pais),
  salvarObjetivos: (selecionados: string[]) => salvarObjetivos(selecionados),
  salvarTemasSensiveis: (selecionados: string[]) => salvarTemasSensiveis(selecionados),
  concluirPersonalizacao: (horario: string | null) => concluirPersonalizacao(horario),
}));

vi.mock('@/app/perfil/actions', () => ({ sair: vi.fn() }));

beforeEach(() => {
  push.mockClear();
  registrarConsentimento.mockClear();
  confirmarPais.mockClear();
  salvarObjetivos.mockClear();
  salvarTemasSensiveis.mockClear();
  concluirPersonalizacao.mockClear();
});

describe('OnboardingClient', () => {
  it('conta nova: pergunta maioridade, termos e depois país, nessa ordem', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={false} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    expect(screen.getByText(/você tem 18 anos ou mais/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sim, tenho 18\+/i }));

    fireEvent.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /dados sensíveis/i }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/de qual país você está acessando/i)).toBeInTheDocument();
    });
    expect(registrarConsentimento).toHaveBeenCalledTimes(1);
  });

  it('conta que já tinha consentimento mas não confirmou país: pula direto para a etapa de país', () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );
    expect(screen.getByText(/de qual país você está acessando/i)).toBeInTheDocument();
    expect(screen.queryByText(/você tem 18 anos ou mais/i)).not.toBeInTheDocument();
  });

  it('exige escolher um país antes de habilitar confirmar', () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
  });

  it('chama confirmarPais com o país escolhido', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(confirmarPais).toHaveBeenCalledWith('BR');
    });
  });

  it('mostra erro retornado pela action sem travar a tela', async () => {
    confirmarPais.mockResolvedValueOnce({ erro: 'Não foi possível confirmar o país agora. Tente novamente.' });
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível confirmar o país agora/i)).toBeInTheDocument();
    });
  });

  it('se país já está confirmado, terminar o consentimento manda direto para a home em vez de perguntar país de novo', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={false} paisJaConfirmado={true} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: /sim, tenho 18\+/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /dados sensíveis/i }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByText(/de qual país você está acessando/i)).not.toBeInTheDocument();
  });
});

describe('OnboardingClient — etapa de personalização (após país)', () => {
  it('após confirmar país com sucesso, avança para a etapa de objetivos em vez de terminar', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('percorre objetivos → temas → lembrete e conclui chamando concluirPersonalizacao', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    await waitFor(() => expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarObjetivos).toHaveBeenCalledWith([]));

    await waitFor(() => expect(screen.getByText(/corpo e aparência/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarTemasSensiveis).toHaveBeenCalledWith([]));

    await waitFor(() => expect(screen.getByLabelText(/horário/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^(concluir|salvar)/i }));
    await waitFor(() => expect(concluirPersonalizacao).toHaveBeenCalledWith('09:00'));
  });

  it('escolhendo "prefiro decidir depois"/"não quero lembretes agora" em tudo, ainda assim conclui a etapa', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Portugal' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    await waitFor(() => expect(screen.getByText(/fortalecer minha autoestima/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Prefiro decidir depois' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarObjetivos).toHaveBeenCalledWith(['decidir_depois']));

    await waitFor(() => expect(screen.getByText(/prefiro não responder/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Prefiro não responder' }));
    fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }));
    await waitFor(() => expect(salvarTemasSensiveis).toHaveBeenCalledWith(['prefiro_nao_responder']));

    await waitFor(() => expect(screen.getByLabelText(/horário/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /não quero lembretes agora/i }));
    await waitFor(() => expect(concluirPersonalizacao).toHaveBeenCalledWith(null));
  });

  it('se a personalização já foi concluída antes, confirmar país manda direto para a home, sem repetir a etapa', async () => {
    render(
      <OnboardingClient consentimentoJaRegistrado={true} paisJaConfirmado={false} personalizacaoJaConcluida={true} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByText(/fortalecer minha autoestima/i)).not.toBeInTheDocument();
  });
});
