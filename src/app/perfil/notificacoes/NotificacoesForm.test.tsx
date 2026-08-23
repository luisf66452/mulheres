import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import NotificacoesForm from './NotificacoesForm';
import type { NotificacoesPreferencias } from '@/lib/perfil/notificacoesPreferencias';

const inscreverPush = vi.fn();
vi.mock('@/lib/push/subscribe', () => ({
  inscreverPush: () => inscreverPush(),
}));

const salvarHorarioPreferido = vi.fn().mockResolvedValue({});
vi.mock('@/app/settings/actions', () => ({
  salvarHorarioPreferido: (...args: unknown[]) => salvarHorarioPreferido(...args),
}));

const salvarPreferenciasNotificacao = vi.fn().mockResolvedValue({});
const pausarNotificacoes = vi.fn();
const reativarNotificacoes = vi.fn().mockResolvedValue({});
const removerDispositivo = vi.fn().mockResolvedValue({});
const enviarNotificacaoTeste = vi.fn();
vi.mock('./actions', () => ({
  salvarPreferenciasNotificacao: (...args: unknown[]) => salvarPreferenciasNotificacao(...args),
  pausarNotificacoes: (...args: unknown[]) => pausarNotificacoes(...args),
  reativarNotificacoes: (...args: unknown[]) => reativarNotificacoes(...args),
  removerDispositivo: (...args: unknown[]) => removerDispositivo(...args),
  enviarNotificacaoTeste: (...args: unknown[]) => enviarNotificacaoTeste(...args),
}));

const PREFERENCIAS_PADRAO: NotificacoesPreferencias = {
  lembreteCheckin: true,
  lembreteJornada: true,
  lembretePraticas: true,
  lembreteInatividade: true,
  avisosNovidades: false,
  resumoSemanal: true,
  diasSemana: [0, 1, 2, 3, 4, 5, 6],
  horarioSilencioInicio: '21:30',
  horarioSilencioFim: '09:00',
  pausadaAte: null,
};

function renderForm(preferencias: Partial<NotificacoesPreferencias> = {}, dispositivos: { id: string; userAgent: string | null; criadoEm: string }[] = []) {
  return render(
    <NotificacoesForm
      usuariaId="usuaria-1"
      horarioAtual="19:00"
      preferenciasIniciais={{ ...PREFERENCIAS_PADRAO, ...preferencias }}
      dispositivosIniciais={dispositivos}
    />
  );
}

// Notification é lida via `'Notification' in window` + `Notification.permission`
// dentro de um useEffect — por isso cada teste define a global antes de
// renderizar, e o afterEach remove para o próximo teste começar sem suporte
// nenhum (mesmo estado "indisponível" que um navegador sem Push API real).
function definirPermissaoNoNavegador(permissao: 'granted' | 'denied' | 'default' | null) {
  if (permissao === null) {
    delete (window as unknown as { Notification?: unknown }).Notification;
    return;
  }
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission: permissao },
  });
}

describe('NotificacoesForm', () => {
  beforeEach(() => {
    inscreverPush.mockReset();
    salvarPreferenciasNotificacao.mockClear();
    pausarNotificacoes.mockReset();
    reativarNotificacoes.mockClear();
    removerDispositivo.mockClear();
    enviarNotificacaoTeste.mockReset();
  });

  afterEach(() => {
    definirPermissaoNoNavegador(null);
  });

  it('permissão "default": mostra o card de consentimento e NÃO chama a API nativa sozinho', async () => {
    definirPermissaoNoNavegador('default');
    renderForm();

    await waitFor(() => {
      expect(screen.getByText(/quer receber lembretes delicados/i)).toBeInTheDocument();
    });
    expect(inscreverPush).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /ativar notificações/i })).toBeInTheDocument();
  });

  it('clicar em "Ativar notificações" e a permissão ser concedida: mostra "Ativadas" e libera os lembretes', async () => {
    definirPermissaoNoNavegador('default');
    inscreverPush.mockResolvedValue('inscrita');
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: /ativar notificações/i }));

    await waitFor(() => {
      expect(screen.getByText(/^ativadas\.$/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/lembrete diário de check-in/i)).toBeEnabled();
  });

  it('clicar em "Ativar notificações" e a permissão ser negada: mostra instrução de reativação, nunca insiste', async () => {
    definirPermissaoNoNavegador('default');
    inscreverPush.mockResolvedValue('negado');
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: /ativar notificações/i }));

    await waitFor(() => {
      expect(screen.getByText(/permissão negada/i)).toBeInTheDocument();
    });
    // Sem um segundo botão de "ativar" para insistir de novo.
    expect(screen.queryByRole('button', { name: /ativar notificações/i })).not.toBeInTheDocument();
  });

  it('navegador incompatível com Push API: mostra aviso de indisponibilidade, sem tentar nada', async () => {
    definirPermissaoNoNavegador(null);
    renderForm();

    await waitFor(() => {
      expect(screen.getByText(/não suporta notificações push/i)).toBeInTheDocument();
    });
    expect(inscreverPush).not.toHaveBeenCalled();
  });

  it('permissão já "denied" ao carregar a página: mostra instruções de reativação pelo navegador, sem botão nativo', async () => {
    definirPermissaoNoNavegador('denied');
    renderForm();

    await waitFor(() => {
      expect(screen.getByText(/já estão bloqueadas|estão bloqueadas nas configurações/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /ativar notificações/i })).not.toBeInTheDocument();
  });

  it('permissão "granted": os toggles de lembrete ficam habilitados e alteram a preferência no servidor', async () => {
    definirPermissaoNoNavegador('granted');
    renderForm();

    const toggleInatividade = await screen.findByLabelText(/quando eu sumir por alguns dias/i);
    expect(toggleInatividade).toBeEnabled();

    fireEvent.click(toggleInatividade);

    expect(salvarPreferenciasNotificacao).toHaveBeenCalledWith({ lembreteInatividade: false });
  });

  it('lista múltiplos dispositivos e remove um deles otimisticamente', async () => {
    definirPermissaoNoNavegador('granted');
    renderForm({}, [
      { id: 'dev-1', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17)', criadoEm: '2026-08-01' },
      { id: 'dev-2', userAgent: 'Mozilla/5.0 (Windows NT 10.0)', criadoEm: '2026-08-02' },
    ]);

    expect(await screen.findByText('iPhone/iPad')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();

    const botoesRemover = screen.getAllByRole('button', { name: /remover este dispositivo/i });
    expect(botoesRemover).toHaveLength(2);

    fireEvent.click(botoesRemover[0]);

    await waitFor(() => {
      expect(screen.queryByText('iPhone/iPad')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(removerDispositivo).toHaveBeenCalledWith('dev-1');
  });

  it('"pausar por 7 dias" mostra o banner de pausa e permite reativar antes do prazo', async () => {
    definirPermissaoNoNavegador('granted');
    pausarNotificacoes.mockResolvedValue({ pausadaAte: '2099-01-01' });
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: /pausar notificações por 7 dias/i }));

    await waitFor(() => {
      expect(screen.getByText(/pausadas até 2099-01-01/i)).toBeInTheDocument();
    });

    // O texto do banner e o fim da transição (`pausando` -> false) são dois
    // setState separados dentro do mesmo callback de startTransition — podem
    // confirmar em commits distintos. "Reativar agora" fica `disabled=
    // {pausando}`, e fireEvent.click num botão disabled não dispara o
    // onClick no jsdom; por isso espera o botão ficar habilitado antes de
    // clicar, em vez de assumir que o banner já visível implica isso.
    const botaoReativar = await waitFor(() => {
      const botao = screen.getByRole('button', { name: /reativar agora/i });
      expect(botao).toBeEnabled();
      return botao;
    });
    fireEvent.click(botaoReativar);

    await waitFor(() => {
      expect(reativarNotificacoes).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText(/pausadas até/i)).not.toBeInTheDocument();
    });
  });

  it('"enviar notificação de teste": mostra sucesso quando a action confirma o envio', async () => {
    definirPermissaoNoNavegador('granted');
    enviarNotificacaoTeste.mockResolvedValue({ enviados: 1 });
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: /enviar notificação de teste/i }));

    await waitFor(() => {
      expect(screen.getByText(/notificação de teste enviada/i)).toBeInTheDocument();
    });
  });

  it('"enviar notificação de teste": mostra o erro da action em vez de um sucesso falso', async () => {
    definirPermissaoNoNavegador('granted');
    enviarNotificacaoTeste.mockResolvedValue({ erro: 'Ative as notificações neste dispositivo antes de enviar um teste.' });
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: /enviar notificação de teste/i }));

    await waitFor(() => {
      expect(screen.getByText(/ative as notificações neste dispositivo/i)).toBeInTheDocument();
    });
  });
});
